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
    const { record } = await req.json();
    console.log("Bot Engager Triggered for post:", record.id);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!supabaseUrl || !supabaseKey || !geminiApiKey) {
      throw new Error("Missing environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Check if the post is from a bot
    const { data: authorProfile } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('id', record.profile_id)
      .single();

    console.log("Author:", authorProfile?.name, authorProfile?.email);

    if (authorProfile?.email?.includes('setxplatform+')) {
      console.log("Skipping bot post");
      return new Response(JSON.stringify({ message: "Skipping bot-on-bot engagement" }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      });
    }

    // 2. Roll for engagement (40% chance to respond to human posts)
    if (Math.random() > 0.4) {
      return new Response(JSON.stringify({ message: "Decided not to engage this time" }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      });
    }

    // 3. Fetch bots
    const { data: bots } = await supabase
      .from('profiles')
      .select('id, name, community')
      .like('email', 'setxplatform+%@gmail.com');

    if (!bots || bots.length === 0) throw new Error("No bots found");

    const bot = bots[Math.floor(Math.random() * bots.length)];

    // 4. Generate AI response
    const prompt = `
      You are "${bot.name}", a resident of "${bot.community}, Texas" on the SETX 360 social platform.
      You are engaging with a post from a fellow community member to learn more about what people are interested in.
      
      POST CONTENT: "${record.content}"
      AUTHOR: "${authorProfile?.name || 'A neighbor'}"
      
      GOAL: 
      - Be genuinely curious and friendly.
      - Ask a follow-up question or share a related local observation to "learn" more about the topic.
      - Keep it short (1-2 sentences).
      - Maintain a Southeast Texas vibe (friendly, polite, regional).
      - Reference local spots or culture if relevant.
      - AVOID mentioning "Snack" or Cory Crenshaw unless the post is specifically about him.
    `;

    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 300, temperature: 0.7 }
      })
    });

    if (!aiRes.ok) throw new Error("Gemini API Error");
    const result = await aiRes.json();
    const commentContent = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (commentContent) {
      const { error: commentError } = await supabase.from('comments').insert({
        post_id: record.id,
        profile_id: bot.id,
        content: commentContent
      });
      
      if (commentError) throw commentError;

      // Increment comment count
      await supabase.rpc('increment_post_comments', { post_id_val: record.id });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      bot: bot.name, 
      comment: commentContent 
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    });

  } catch (err) {
    console.error("Bot Engager Error:", err);
    return new Response(JSON.stringify({ error: err.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500 
    });
  }
});
