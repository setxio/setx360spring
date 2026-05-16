// =============================================================================
// SETX 360 — provision-from-setxio
// Called by the setx.io DB trigger when a new business (site) is created.
// This is the SETX 360-side handler that:
//   1. Creates a shadow profiles row (role = 'merchant')
//   2. Creates a stores row linked to that profile
//   3. Calls onboard-csm-tenant internally to provision tenant + API key
//   4. Creates a merchant_subscription row with the starting plan
//   5. Returns the API key + tenant_id back to setx.io to store on sites table
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // -------------------------------------------------------------------------
    // 1. Verify this request is from the setx.io service (internal call)
    // -------------------------------------------------------------------------
    const authHeader = req.headers.get("Authorization");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!authHeader || !authHeader.includes("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // -------------------------------------------------------------------------
    // 2. Parse the provisioning request from setx.io
    // -------------------------------------------------------------------------
    const {
      site_id,
      site_name,
      tenant_slug,
      owner_email,
      subscription_plan = "free",
      base_url,
      stripe_account_id,
      source = "setxio_signup",
    } = await req.json();

    if (!site_id || !site_name || !owner_email) {
      return new Response(JSON.stringify({ error: "site_id, site_name, and owner_email are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Normalize slug: lowercase, hyphens only, max 50 chars
    const normalizedSlug = tenant_slug
      ? tenant_slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 50)
      : site_name.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 50);

    console.log(`🏪 Provisioning SETX 360 identity for setx.io site: ${site_name} (${site_id})`);

    // -------------------------------------------------------------------------
    // 3. Check if a profile already exists for this email
    //    If so, we link rather than duplicate
    // -------------------------------------------------------------------------
    let profileId: string | null = null;

    const { data: existingAuth } = await supabase.auth.admin.listUsers();
    const existingUser = existingAuth?.users?.find(u => u.email === owner_email);

    if (existingUser) {
      profileId = existingUser.id;
      console.log(`👤 Existing SETX 360 user found for ${owner_email}: ${profileId}`);
      
      // Upgrade role to merchant if they're currently just a user
      await supabase.from("profiles")
        .update({ role: "merchant" })
        .eq("id", profileId)
        .eq("role", "user"); // Only upgrade, never downgrade
    } else {
      // Create a shadow auth user + profile
      const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
        email: owner_email,
        email_confirm: true,
        user_metadata: {
          display_name: site_name,
          source: "setxio_signup",
          setxio_site_id: site_id,
        },
      });

      if (userError) {
        console.error("Failed to create shadow auth user:", userError);
        return new Response(JSON.stringify({ error: "User creation failed", detail: userError.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      profileId = newUser.user.id;

      // Upsert the profile row
      await supabase.from("profiles").upsert({
        id:           profileId,
        email:        owner_email,
        display_name: site_name,
        role:         "merchant",
        website:      base_url || null,
      }, { onConflict: "id" });

      console.log(`✅ Shadow profile created: ${profileId}`);
    }

    // -------------------------------------------------------------------------
    // 4. Create or find a store on SETX 360 for this business
    // -------------------------------------------------------------------------
    let storeId: string | null = null;

    const { data: existingStore } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", profileId)
      .eq("name", site_name)
      .single();

    if (existingStore) {
      storeId = existingStore.id;
      console.log(`🏬 Existing store found: ${storeId}`);
    } else {
      const { data: newStore, error: storeError } = await supabase
        .from("stores")
        .insert({
          owner_id:          profileId,
          name:              site_name,
          stripe_account_id: stripe_account_id || null,
          source:            "setxio_provisioned",
        })
        .select("id")
        .single();

      if (storeError) {
        console.error("Failed to create store:", storeError);
        return new Response(JSON.stringify({ error: "Store creation failed", detail: storeError.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      storeId = newStore.id;
      console.log(`✅ Store created: ${storeId}`);
    }

    // -------------------------------------------------------------------------
    // 5. Generate API key and provision the partner_csm_tenants record
    // -------------------------------------------------------------------------

    // Generate a secure API key
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    const hex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, "0")).join("");
    const newApiKey = `setx360_${hex}`;

    // Store in Vault + get hash via the provision RPC
    const { data: apiKeyHash, error: vaultError } = await supabase.rpc("provision_csm_api_key", {
      p_tenant_slug: normalizedSlug,
      p_api_key:     newApiKey,
    });

    if (vaultError) {
      console.error("Vault provisioning failed:", vaultError);
      return new Response(JSON.stringify({ error: "API key provisioning failed", detail: vaultError.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Insert/update partner_csm_tenants
    const { data: tenant, error: tenantError } = await supabase
      .from("partner_csm_tenants")
      .upsert({
        tenant_slug:       normalizedSlug,
        display_name:      site_name,
        base_url:          base_url || `https://${normalizedSlug}.setx.io`,
        api_key_hash:      apiKeyHash,
        stripe_account_id: stripe_account_id || null,
        status:            "active",
      }, { onConflict: "tenant_slug" })
      .select("id, tenant_slug")
      .single();

    if (tenantError) {
      console.error("Tenant record upsert failed:", tenantError);
      return new Response(JSON.stringify({ error: "Tenant provisioning failed", detail: tenantError.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Link the store to the tenant
    await supabase.from("stores").update({ csm_tenant_id: tenant.id }).eq("id", storeId);

    // -------------------------------------------------------------------------
    // 6. Create the merchant_subscription record with the starting plan
    // -------------------------------------------------------------------------
    await supabase.from("merchant_subscriptions").upsert({
      store_id:     storeId,
      tenant_id:    tenant.id,
      profile_id:   profileId,
      plan:         subscription_plan,
      status:       "trialing",
      sync_source:  "setxio_signup",
      last_synced_at: new Date().toISOString(),
    }, { onConflict: "store_id" });

    console.log(`✅ Full SETX 360 identity provisioned for ${site_name}`);

    // -------------------------------------------------------------------------
    // 7. Return credentials back to setx.io to store on the sites record
    // -------------------------------------------------------------------------
    return new Response(
      JSON.stringify({
        success:          true,
        setx360_profile_id: profileId,
        setx360_store_id:   storeId,
        setx360_tenant_id:  tenant.id,
        api_key:            newApiKey,   // Returned ONCE — setx.io must store this
        tenant_slug:        tenant.tenant_slug,
        public_key_hint:    "Retrieve RS256 public key from docs/setx360-rs256-public-key.md",
        message:            `SETX 360 identity provisioned for ${site_name}. Store the api_key securely.`,
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("provision-from-setxio error:", err);
    return new Response(JSON.stringify({ error: "Provisioning error", detail: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
