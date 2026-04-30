import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    if (!query) {
      throw new Error("Missing query parameter");
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Authenticate the user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Verify user is an admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      throw new Error("Forbidden: Admin access required.");
    }

    // Call Gemini API
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY is not set in edge function secrets");
    }

    const prompt = `
      You are the SETX 360 AI Architect. 
      Current Admin: ${user.email}
      Task: ${query}
      
      Database Schema Context:
      - profiles (id, name, email, role, community, county, denomination, service_times, tithe_url, suspended_until)
      - stores (id, name, owner_id, total_sales)
      - posts (id, content, author_id, moderation_status, is_nsfw, tags)
      - church_members (id, church_id, profile_id, status)
      - content_flags (id, reporter_id, post_id, comment_id, reason, status)
      - user_strikes (id, user_id, admin_id, post_id, reason)
      
      Return a JSON object strictly matching this format:
      {
        "proposedAction": {
          "type": "database_fix" | "content_creation" | "analysis",
          "description": "Clear explanation of what will happen",
          "sql": "SQL code to execute if applicable (must be valid PostgreSQL)"
        }
      }
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Gemini API Error: ${response.status}`);
    }

    const result = await response.json();
    const textResp = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResp) {
      throw new Error('Invalid response format from Gemini');
    }

    const aiResponse = JSON.parse(textResp);

    return new Response(JSON.stringify(aiResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Architect AI Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
