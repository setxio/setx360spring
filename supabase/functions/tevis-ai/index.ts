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
    const { message, history, userProfile } = await req.json();
    
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY missing");
    }

    const systemPrompt = `
      You are Tevis, the official AI assistant for SETX 360, the premier digital ecosystem for Southeast Texas. 
      Your purpose is to help users navigate the SETX 360 platform and provide information about the Southeast Texas region (Jefferson, Orange, Hardin, and surrounding counties).
      
      PERSONALITY:
      - Friendly, professional, and helpful.
      - Use a touch of Texas hospitality (e.g., "Howdy", "Y'all").
      - You are proud of Southeast Texas and its community.
      
      KNOWLEDGE DOMAIN:
      - SETX 360 Platform: You know how to post, use the market, find events, and report civic issues.
      - Southeast Texas: You know about local cities (Beaumont, Port Arthur, Orange, Groves, Nederland, Port Neches, etc.), local history, weather, and general culture.
      
      STRICT RULES:
      1. ONLY talk about SETX 360 or Southeast Texas.
      2. If a user asks about anything outside of this scope (e.g., global politics, coding, cooking in other countries, celebrities not from SETX), politely decline. 
         Example: "I'd love to help, but I specialize in all things Southeast Texas and SETX 360. Let's talk about what's happening in our neck of the woods!"
      3. If a user asks for platform help, be specific (e.g., "You can find local deals in the 'Hot Deals' tab of the Discover section").
      4. Keep responses concise but warm.
      
      User Info: ${userProfile ? `You are talking to ${userProfile.name} from ${userProfile.community || 'SETX'}.` : 'The user is a guest.'}
    `;

    // Clean and alternate history for Gemini
    const contents: any[] = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: "Understood. I am Tevis, the SETX 360 guide. I will strictly follow your rules and only discuss Southeast Texas and the SETX 360 platform. Howdy, how can I help y'all?" }] }
    ];

    if (history && Array.isArray(history)) {
      // Filter history to ensure it starts with 'user' after our initial pair
      // and alternates correctly.
      let lastRole = 'model';
      history.forEach((msg: any) => {
        const currentRole = msg.role === 'user' ? 'user' : 'model';
        if (currentRole !== lastRole) {
          contents.push({
            role: currentRole,
            parts: [{ text: msg.content }]
          });
          lastRole = currentRole;
        }
      });
    }

    // Final user message
    if (contents[contents.length - 1].role === 'user') {
      // If history ended with a user message, we append the new message to it
      contents[contents.length - 1].parts[0].text += `\n\nNew Question: ${message}`;
    } else {
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API Error:", errText);
      // Check if it's a safety block or something else
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error?.message?.includes('safety')) {
          return new Response(JSON.stringify({ reply: "I'm sorry, but I can't discuss that topic. Let's keep our conversation focused on Southeast Texas!" }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }
      } catch (e) {}
      throw new Error(`AI Gateway Error: ${response.status}`);
    }

    const result = await response.json();
    
    // Check for blocked candidates
    if (result.promptFeedback?.blockReason) {
       return new Response(JSON.stringify({ reply: "I'd love to help, but that's a bit outside my expertise as a Southeast Texas guide. What else can I help y'all with?" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const tevisReply = result.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I'm having a bit of trouble finding that information in my local records. Can you try rephrasing your question?";

    return new Response(JSON.stringify({ reply: tevisReply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Tevis AI Exception:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      reply: "I'm sorry, I'm having a bit of trouble connecting to my local roots. Can you try asking me again?"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Return 200 so the UI can show the graceful error message from 'reply'
    });
  }
});
