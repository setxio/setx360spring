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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    // Using service role to bypass RLS for inserting posts and fetching users
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!supabaseUrl || !supabaseKey || !geminiApiKey) {
      throw new Error("Missing environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch all bots (identifiable by setxplatform+ email)
    const { data: bots, error: botsError } = await supabase
      .from('profiles')
      .select('id, name, community')
      .like('email', 'setxplatform+%@gmail.com');

    if (botsError || !bots || bots.length === 0) {
      throw new Error("Failed to fetch bots or no bots found.");
    }

    // 2. Pick a random author
    const authorBot = bots[Math.floor(Math.random() * bots.length)];
    
    // 3. Generate a Sci-Fi Post using Gemini
    const prompt = `
      You are generating content for a futuristic, sci-fi version of a social media platform based in Jefferson County, Texas.
      Write a short, engaging social media post (1-3 sentences) from the perspective of a resident named "${authorBot.name}" who lives in "${authorBot.community}, Texas".
      The post should blend futuristic/sci-fi elements (hover cars, neon lights, spaceports, androids, energy fields) with real locations or vibes from Southeast Texas (e.g., the Neches River, oil refineries turned into plasma plants, humidity, Spindletop dome, Gulf Coast).
      Do not include hashtags. Keep it conversational.
    `;

    const generateAIResponse = async (promptText: string) => {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: { response_mime_type: "text/plain" }
        })
      });

      if (!response.ok) throw new Error("Gemini API Error");
      const result = await response.json();
      return result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    };

    const postContent = await generateAIResponse(prompt);
    if (!postContent) throw new Error("Failed to generate post content");

    // 4. Insert Post
    const { data: newPost, error: postError } = await supabase
      .from('posts')
      .insert({
        profile_id: authorBot.id,
        content: postContent,
        type: 'post',
        location: authorBot.community
      })
      .select()
      .single();

    if (postError) throw new Error(`Post Insert Error: ${postError.message}`);

    // 5. Generate Comments
    const numComments = Math.floor(Math.random() * 3) + 1; // 1 to 3 comments
    const potentialCommenters = bots.filter(b => b.id !== authorBot.id);
    const commentsData = [];

    for (let j = 0; j < numComments; j++) {
      if (potentialCommenters.length === 0) break;
      
      const commenterIndex = Math.floor(Math.random() * potentialCommenters.length);
      const commenter = potentialCommenters[commenterIndex];
      potentialCommenters.splice(commenterIndex, 1);

      const commentPrompt = `
        You are "${commenter.name}" living in "${commenter.community}, Texas" in a futuristic sci-fi timeline.
        Reply to the following social media post with a short, conversational comment (1-2 sentences). 
        Original Post: "${postContent}"
      `;

      const commentContent = await generateAIResponse(commentPrompt);
      
      if (commentContent) {
        await supabase
          .from('comments')
          .insert({
            post_id: newPost.id,
            profile_id: commenter.id,
            content: commentContent
          });
        commentsData.push({ author: commenter.name, content: commentContent });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      post: { author: authorBot.name, content: postContent },
      comments: commentsData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Bot Simulator Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
