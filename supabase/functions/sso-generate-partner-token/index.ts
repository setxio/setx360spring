import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as jose from "https://deno.land/x/jose@v4.14.4/index.ts";

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
    // 1. Get current user session
    const authHeader = req.headers.get("Authorization")!;
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 2. Parse request
    const { tenant_id } = await req.json();

    if (!tenant_id) {
      return new Response(JSON.stringify({ error: "tenant_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 3. Verify user ownership of the tenant
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id, csm_tenant_id, partner_csm_tenants(tenant_slug, base_url)")
      .eq("owner_id", user.id)
      .eq("csm_tenant_id", tenant_id)
      .single();

    if (storeError || !store) {
      return new Response(JSON.stringify({ error: "Unauthorized or Tenant not found" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const tenant = store.partner_csm_tenants;

    // 4. Generate a short-lived SSO Token
    const secret = new TextEncoder().encode(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
    const token = await new jose.SignJWT({
      sub: user.id,
      email: user.email,
      tenant_id: tenant_id,
      iat: Math.floor(Date.now() / 1000),
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("2m") // Extremely short-lived
      .sign(secret);

    // 5. Construct the redirect URL
    const baseUrl = tenant.base_url || `https://${tenant.tenant_slug}.setx.io`;
    const ssoUrl = `${baseUrl}/api/auth/sso?token=${token}`;

    return new Response(
      JSON.stringify({ url: ssoUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("sso-generate-partner-token error:", err);
    return new Response(JSON.stringify({ error: "Internal Error", detail: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
