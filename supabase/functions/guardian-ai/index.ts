import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    
    // Webhook payload from Supabase
    // Typical format: { type: 'INSERT', table: 'posts', record: { id, content, ... } }
    if (payload.table !== 'posts') {
      return new Response("Ignored: Not a post", { headers: corsHeaders });
    }

    const postContent = payload.record?.content;
    const postId = payload.record?.id;
    const authorId = payload.record?.profile_id;

    if (!postContent) {
      return new Response("Ignored: No content to analyze", { headers: corsHeaders });
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY missing");
    }

    const prompt = `
      You are the SETX 360 AI Guardian. Your job is to moderate social media posts.
      Analyze the following text. If it contains explicit NSFW content, intense profanity, harassment, or severe hate speech, you must flag it.
      
      Post Text: "${postContent}"
      
      Return a strict JSON object:
      {
        "isViolation": boolean,
        "reason": "String explaining why it is a violation, or null if it is safe"
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
      throw new Error("Failed to call Gemini API");
    }

    const result = await response.json();
    const textResp = result.candidates?.[0]?.content?.parts?.[0]?.text;
    const aiResponse = JSON.parse(textResp);

    if (aiResponse.isViolation) {
      // Initialize Supabase admin client (Service Role Key required for inserting strikes bypassing RLS)
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // 1. Insert a strike
      await supabaseAdmin.from('user_strikes').insert({
        user_id: authorId,
        post_id: postId,
        reason: `Automated AI Guardian Flag: ${aiResponse.reason}`
      });

      // 2. Hide the post
      await supabaseAdmin.from('posts')
        .update({ moderation_status: 'hidden', is_nsfw: true })
        .eq('id', postId);
        
      console.log(`Action taken against post ${postId}: ${aiResponse.reason}`);
    }

    return new Response(JSON.stringify({ status: 'analyzed', isViolation: aiResponse.isViolation }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Guardian AI Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
