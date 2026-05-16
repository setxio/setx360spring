// =============================================================================
// SETX 360 — onboard-csm-tenant
// Admin-only Edge Function that fully automates Partner CSM tenant onboarding.
// ONE call does everything:
//   1. Generates a cryptographically secure API key
//   2. Stores it encrypted in Supabase Vault (via provision_csm_api_key RPC)
//   3. Computes SHA-256 hash and inserts/updates partner_csm_tenants record
//   4. Returns the plaintext API key EXACTLY ONCE — display to admin, then gone
//
// Also supports: { action: "rotate" } to cycle an existing tenant's API key
// =============================================================================
// Request Body (create):
//   {
//     "action": "create",
//     "tenant_slug": "beaumont-bbq",         // lowercase-hyphenated
//     "display_name": "Beaumont BBQ Co.",
//     "base_url": "https://beaumont-bbq.setx.io",
//     "contact_email": "owner@beaumontbbq.com",
//     "stripe_account_id": "acct_XXXXX",      // optional
//     "platform_fee_bps": 500                 // optional, defaults to 500 (5%)
//   }
//
// Request Body (rotate key):
//   {
//     "action": "rotate",
//     "tenant_slug": "beaumont-bbq"
//   }
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generates a cryptographically strong API key
// Format: setx360_<64 hex chars> — unambiguous, copy-pasteable
function generateApiKey(): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32)); // 256 bits
  const hex = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `setx360_${hex}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // -------------------------------------------------------------------------
    // 1. Verify the caller is an authenticated SETX 360 admin
    // -------------------------------------------------------------------------
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role for all DB operations (Vault access requires it)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify the user's session token separately
    const userToken = authHeader.replace("Bearer ", "").trim();
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser(userToken);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check that the caller is a SETX 360 platform admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden: Only platform admins can onboard CSM tenants" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // -------------------------------------------------------------------------
    // 2. Parse the request
    // -------------------------------------------------------------------------
    const body = await req.json();
    const { action = "create", tenant_slug } = body;

    if (!tenant_slug) {
      return new Response(JSON.stringify({ error: "tenant_slug is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize slug: lowercase, hyphens only
    const normalizedSlug = tenant_slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");

    // -------------------------------------------------------------------------
    // 3. Generate the new API key
    // -------------------------------------------------------------------------
    const newApiKey = generateApiKey();

    // -------------------------------------------------------------------------
    // 4. Store in Vault + get hash — single atomic RPC call
    //    provision_csm_api_key() does:
    //      - vault.create_secret(api_key, 'CSM_APIKEY_BEAUMONT_BBQ', description)
    //      - returns encode(digest(api_key, 'sha256'), 'hex')
    // -------------------------------------------------------------------------
    const rpcName = action === "rotate" ? "rotate_csm_api_key" : "provision_csm_api_key";

    const { data: apiKeyHash, error: vaultError } = await supabase.rpc(rpcName, {
      p_tenant_slug: normalizedSlug,
      p_api_key:     newApiKey,
    });

    if (vaultError) {
      console.error(`Vault provisioning error for ${normalizedSlug}:`, vaultError);
      return new Response(
        JSON.stringify({
          error:  "Failed to provision API key in Vault",
          detail: vaultError.message,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // -------------------------------------------------------------------------
    // 5. Create or update the partner_csm_tenants record
    // -------------------------------------------------------------------------
    let tenantRecord: any;

    if (action === "create") {
      const {
        display_name,
        base_url,
        contact_email,
        stripe_account_id,
        platform_fee_bps = 500,
      } = body;

      if (!display_name || !base_url) {
        return new Response(
          JSON.stringify({ error: "display_name and base_url are required for action: create" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: newTenant, error: tenantError } = await supabase
        .from("partner_csm_tenants")
        .insert({
          tenant_slug:        normalizedSlug,
          display_name,
          base_url,
          api_key_hash:       apiKeyHash, // SHA-256 hash — NOT the plaintext key
          stripe_account_id:  stripe_account_id || null,
          contact_email:      contact_email || null,
          platform_fee_bps,
          status:             "active",
        })
        .select("id, tenant_slug, display_name, base_url, status, platform_fee_bps, created_at")
        .single();

      if (tenantError) {
        return new Response(
          JSON.stringify({ error: "Failed to create tenant record", detail: tenantError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      tenantRecord = newTenant;
      console.log(`✅ CSM Tenant created: ${normalizedSlug} (${newTenant.id})`);

    } else if (action === "rotate") {
      // Key rotation — only update the hash, nothing else changes
      const { data: updatedTenant, error: updateError } = await supabase
        .from("partner_csm_tenants")
        .update({
          api_key_hash: apiKeyHash, // New hash from the rotated key
          updated_at:   new Date().toISOString(),
        })
        .eq("tenant_slug", normalizedSlug)
        .select("id, tenant_slug, display_name, status")
        .single();

      if (updateError) {
        return new Response(
          JSON.stringify({ error: "Failed to update tenant key hash", detail: updateError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      tenantRecord = updatedTenant;
      console.log(`🔑 CSM Tenant key rotated: ${normalizedSlug}`);
    }

    // -------------------------------------------------------------------------
    // 6. Return the plaintext API key EXACTLY ONCE
    //    The admin MUST save this. It cannot be retrieved again — only rotated.
    // -------------------------------------------------------------------------
    return new Response(
      JSON.stringify({
        success: true,
        action,
        tenant: tenantRecord,
        // THE KEY — display this to the admin and never store it anywhere else.
        api_key: newApiKey,
        api_key_hash: apiKeyHash,
        vault_key_name: `CSM_APIKEY_${normalizedSlug.toUpperCase().replace(/-/g, "_")}`,
        warning: "⚠️ SAVE THIS API KEY NOW. It will not be shown again. Give it to the Partner CSM operator to configure in their POS environment.",
        instructions: {
          partner_csm: `Set the following environment variable in the Partner CSM (setx.io) environment:\nSETX360_API_KEY=${newApiKey}`,
          webhook_endpoint: `${tenantRecord?.base_url || "<base_url>"}/api/v1/pos-webhook`,
          bridge_endpoint: `${Deno.env.get("SUPABASE_URL")}/functions/v1/360-bridge-receiver`,
        },
      }),
      {
        status: action === "create" ? 201 : 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (err) {
    console.error("onboard-csm-tenant error:", err);
    return new Response(
      JSON.stringify({ error: "Onboarding error", detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
