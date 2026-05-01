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

    // Format history for Gemini
    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: "Understood. I am Tevis, your Southeast Texas guide. How can I help y'all today?" }] }
    ];

    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Gemini API Error:", err);
      throw new Error("Failed to call Tevis AI");
    }

    const result = await response.json();
    const tevisReply = result.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I'm having a bit of trouble connecting right now. Can you try again?";

    return new Response(JSON.stringify({ reply: tevisReply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Tevis AI Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
