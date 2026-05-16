// =============================================================================
// SETX 360 — Phase 1: generate-sso-jwt
// Creates a signed RS256 JWT and redirects the user to their Partner CSM node.
// SETX 360 is the ONLY issuer of identity. Partner CSM nodes are consumers.
// =============================================================================
// Required Supabase Vault Secrets:
//   RS256_PRIVATE_KEY  — PEM-encoded 2048-bit RSA private key
//
// Required env vars (auto-provided by Supabase):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as jose from "https://deno.land/x/jose@v5.6.3/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SSO_JWT_EXPIRY = "15m"; // JWTs are short-lived for security
const ISSUER = "https://setx360.com"; // setx360 is the canonical Identity Root

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // -------------------------------------------------------------------------
    // 1. Validate the calling user is authenticated in SETX 360
    // -------------------------------------------------------------------------
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify the user's Supabase session token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid or expired session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // -------------------------------------------------------------------------
    // 2. Parse the target tenant from the request body
    // -------------------------------------------------------------------------
    const { tenantSlug } = await req.json();
    if (!tenantSlug) {
      return new Response(JSON.stringify({ error: "tenantSlug is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // -------------------------------------------------------------------------
    // 3. Resolve the tenant — confirm it exists and is active
    // -------------------------------------------------------------------------
    const { data: tenant, error: tenantError } = await supabase
      .from("partner_csm_tenants")
      .select("id, tenant_slug, base_url, status")
      .eq("tenant_slug", tenantSlug)
      .eq("status", "active")
      .single();

    if (tenantError || !tenant) {
      return new Response(JSON.stringify({ error: "Tenant not found or is inactive" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // -------------------------------------------------------------------------
    // 4. Fetch the user's profile for role and metadata inclusion in JWT
    // -------------------------------------------------------------------------
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, name, email, county, state")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "User profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // -------------------------------------------------------------------------
    // 5. Load the RS256 private key from Supabase Vault
    // -------------------------------------------------------------------------
    const privateKeyPem = Deno.env.get("RS256_PRIVATE_KEY");
    if (!privateKeyPem) {
      console.error("CRITICAL: RS256_PRIVATE_KEY is not set in Supabase Vault.");
      return new Response(JSON.stringify({ error: "SSO service is not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Import the PEM key for signing
    const privateKey = await jose.importPKCS8(privateKeyPem, "RS256");

    // -------------------------------------------------------------------------
    // 6. Build and sign the SSO JWT
    // Claims:
    //   sub   — The user's canonical SETX 360 UUID (this is the master identity)
    //   role  — Their platform role (admin, merchant, user)
    //   name  — Display name
    //   email — Email from master auth
    //   county, state — Geographic context for the partner node
    //   tenant — Which Partner CSM node this token is valid for
    //   iss   — setx360.com (the authoritative issuer)
    //   aud   — The target tenant's base URL
    // -------------------------------------------------------------------------
    const ssoToken = await new jose.SignJWT({
      sub:    user.id,
      role:   profile.role,
      name:   profile.name,
      email:  user.email,
      county: profile.county,
      state:  profile.state,
      tenant: tenant.tenant_slug,
    })
      .setProtectedHeader({ alg: "RS256" })
      .setIssuedAt()
      .setIssuer(ISSUER)
      .setAudience(tenant.base_url)
      .setExpirationTime(SSO_JWT_EXPIRY)
      .sign(privateKey);

    // -------------------------------------------------------------------------
    // 7. Build the redirect URL — Partner CSM SSO callback endpoint
    //    e.g., https://beaumont-bbq.setx.io/auth/sso-callback?token=eyJ...
    // -------------------------------------------------------------------------
    const callbackUrl = `${tenant.base_url}/auth/sso-callback?token=${encodeURIComponent(ssoToken)}`;

    console.log(`SSO JWT issued for user ${user.id} → tenant ${tenant.tenant_slug}`);

    return new Response(
      JSON.stringify({
        success: true,
        redirectUrl: callbackUrl,
        tenant: tenant.tenant_slug,
        expiresIn: SSO_JWT_EXPIRY,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (err) {
    console.error("generate-sso-jwt error:", err);
    return new Response(JSON.stringify({ error: "Internal SSO error", detail: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
