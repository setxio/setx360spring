// =============================================================================
// SETX 360 — sso-exchange
// Generates a one-time magic link for seamless SSO from Partner Nodes.
// Requires the caller to provide the valid SUPABASE_SERVICE_ROLE_KEY to prove
// they are a trusted backend (like the setx.io Next.js server).
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // 1. Verify this request is from a trusted backend
    const authHeader = req.headers.get("Authorization");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!authHeader || authHeader !== `Bearer ${serviceKey}`) {
      return new Response(JSON.stringify({ error: "Unauthorized. Missing or invalid service key." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 2. Parse the request
    const { email, redirect_to } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      serviceKey!
    );

    console.log(`🔐 Generating SSO magic link for ${email}`);

    // 3. Generate the magic link using the Admin API
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: redirect_to || 'https://setx360.com/dashboard',
      }
    });

    if (error) {
      console.error("Failed to generate link:", error);
      return new Response(JSON.stringify({ error: "Failed to generate SSO link", detail: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // data.properties.action_link contains the exact URL the user needs to visit
    const actionLink = data.properties?.action_link;

    if (!actionLink) {
       return new Response(JSON.stringify({ error: "Action link not returned from Supabase" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log(`✅ SSO link generated successfully for ${email}`);

    // 4. Return the URL to the caller (who will then issue an HTTP 302 Redirect)
    return new Response(
      JSON.stringify({
        success: true,
        action_link: actionLink,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("sso-exchange error:", err);
    return new Response(JSON.stringify({ error: "Internal server error", detail: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
