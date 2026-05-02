import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, sermonNotes } = await req.json();

    if (!sermonNotes || typeof sermonNotes !== 'string') {
      return new Response(JSON.stringify({ error: "Sermon notes are required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) throw new Error("Gemini API key not configured");

    let systemPrompt = "";

    if (action === 'generate_posts') {
      systemPrompt = `You are a helpful Ministry Assistant for a local church in Southeast Texas. 
      The pastor has provided their sermon notes. 
      Your task is to generate 5 engaging social media posts based on these notes. 
      Each post should be suitable for platforms like Facebook or the SETX 360 platform.
      Include relevant emojis and suggested hashtags. Keep them uplifting and engaging.
      Format the output as a clean Markdown list.`;
    } else if (action === 'generate_guide') {
      systemPrompt = `You are a helpful Ministry Assistant for a local church in Southeast Texas. 
      The pastor has provided their sermon notes. 
      Your task is to generate a Small Group Discussion Guide based on these notes.
      Include a brief summary of the message and 3-5 thought-provoking discussion questions.
      Format the output beautifully in Markdown.`;
    } else {
      systemPrompt = `You are a helpful Ministry Assistant. Summarize the following sermon notes in 1 paragraph for a church newsletter.`;
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: systemPrompt + "\n\nSermon Notes:\n" + sermonNotes }] }
        ]
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No content generated.";

    return new Response(JSON.stringify({ result: generatedText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
