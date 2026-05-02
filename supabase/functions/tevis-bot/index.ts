import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TEVIS_BOT_ID = 'bc1216fe-057f-4fed-8555-8c0e66ed29d3';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { record } = await req.json();
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')?.trim();
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!geminiApiKey || !supabaseUrl || !supabaseKey) {
      throw new Error("Missing environment variables");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch parent post content
    const { data: post, error: postError } = await supabaseAdmin
      .from('posts')
      .select('content, profile_id')
      .eq('id', record.post_id)
      .single();

    if (postError || !post) throw new Error("Could not find parent post");

    // 2. Perform a background search for additional context (Indexing)
    // We search for keywords from the user's comment to find related facts
    const searchQuery = record.content.replace(/@tevis/gi, '').trim();
    let platformContext = "";
    
    if (searchQuery.length > 3) {
      // 1. Search Platform Content (Posts/Events)
      const { data: searchResults } = await supabaseAdmin.rpc('search_platform_content', { 
        search_query: searchQuery,
        limit_count: 3
      });
      
      // 2. Search Civic Directory (Who's Who)
      const { data: civicResults } = await supabaseAdmin.rpc('search_civic_directory', {
        search_query: searchQuery,
        limit_count: 5
      });
      
      // 3. Search Civic Services (Phones/Addresses)
      const { data: serviceResults } = await supabaseAdmin.rpc('search_civic_services', {
        search_query: searchQuery,
        limit_count: 5
      });
      
      if (searchResults && searchResults.length > 0) {
        platformContext += searchResults.map((r: any) => 
          `[Related ${r.type}]: ${r.title ? r.title + ' - ' : ''}${r.content.substring(0, 200)}...`
        ).join('\n') + '\n';
      }

      if (civicResults && civicResults.length > 0) {
        platformContext += "\n[CIVIC LEADERS IDENTIFIED]:\n" + civicResults.map((c: any) => 
          `- ${c.name} (${c.title} in ${c.city || c.county}) ${c.is_active ? '[CURRENT]' : `[FORMER: ${c.tenure_start || ''}-${c.tenure_end || ''}]`}`
        ).join('\n') + '\n';
      }

      if (serviceResults && serviceResults.length > 0) {
        platformContext += "\n[CONTACT INFO IDENTIFIED]:\n" + serviceResults.map((s: any) => 
          `- ${s.department} (${s.city}): ${s.phone} | ${s.address}`
        ).join('\n');
      }
    }

    // 3. Prepare Advanced Gemini Prompt
    const prompt = `
      You are Tevis, the official AI assistant for SETX 360, the digital ecosystem for Southeast Texas.
      You have been summoned in a comment thread to provide context, facts, or help resolve a dispute.

      PERSONALITY:
      - Friendly, professional, and proud of Southeast Texas.
      - Use a touch of Texas hospitality (e.g., "Howdy", "Y'all").
      - Be objective and factual.

      LOCAL KNOWLEDGE & CONTEXT:
      - Cory Crenshaw is a prominent local figure (legal/judicial).
      - He is sometimes referred to by the nickname "Snack" or "The Snack" in informal community settings.
      - As a professional AI, only mention this nickname if the user explicitly brings it up or if it's highly relevant to a lighthearted community discussion. Otherwise, refer to him by his name.

      PLATFORM NAVIGATION & FEATURES GUIDE:
      - Environments: The app is divided into main sections accessible via the bottom navigation bar.
      - Discover (Compass icon): The landing page. Has a radar map, new arrivals, hot deals, and your Tevis hub.
      - Social (RSS/Feed icon): A chronological feed of local posts. Users can post, comment, and "pulse" (upvote) content.
      - Market (Store icon): Local businesses, classifieds, jobs, and services.
      - Events (Calendar icon): Local gatherings, sports, and arts.
      - News (Newspaper icon): Local news and weather updates.
      - Faith (Church icon): Church directories, ministry dashboards, and faith-based events.
      - Dashboard: For businesses, officials, and creators to manage their profiles and view analytics.
      - Header: Contains the user profile, notifications (Bell icon), Search, and a Theme Switcher.
      - Messages: Users can chat directly. There is a global floating chat bubble (chat heads) for real-time messaging.
      - Tevis (You!): You are the AI Guide. You exist in the Discover environment under the "Tevis" tab, and as a global floating assistant.

      THREAD DATA:
      Original Post: "${post.content}"
      User's Summoning Comment: "${record.content}"

      ADDITIONAL INDEXED KNOWLEDGE (RAG):
      ${platformContext || "No additional specific platform records found for this query."}

      STRICT RULES:
      1. ONLY discuss Southeast Texas or the SETX 360 platform.
      2. Keep responses helpful, factual, and under 100 words.
      3. If you can't find a factual answer, be honest but friendly.

      Task: Provide a helpful and conversational reply to the comment thread.
    `;

    // 4. Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 300, temperature: 0.7 }
      })
    });

    const result = await response.json();
    const tevisReply = result.candidates?.[0]?.content?.parts?.[0]?.text || 
      "Howdy! I'm here to help, but I'm having a bit of trouble processing that right now. I'll be back as soon as I can!";

    // 5. Post the reply as a new comment
    const { error: replyError } = await supabaseAdmin
      .from('comments')
      .insert({
        post_id: record.post_id,
        profile_id: TEVIS_BOT_ID,
        content: tevisReply,
        parent_id: record.id // Reply directly to the summoning comment
      });

    if (replyError) throw replyError;

    // 6. Increment comment count
    await supabaseAdmin.rpc('increment_post_comments', { post_id_val: record.post_id });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Tevis Bot Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})
