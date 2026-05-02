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
    
    // Validate payload from Supabase Database Webhook
    if (!payload.record || !payload.table) {
      throw new Error("Invalid payload: missing record or table");
    }

    const { record, table } = payload;
    
    // We only want to process records that have text content
    let textToEmbed = "";
    if (table === 'posts' && record.content) {
      textToEmbed = record.content;
    } else if (table === 'events' && (record.title || record.description)) {
      textToEmbed = `${record.title || ''} ${record.description || ''}`.trim();
    } else {
      return new Response(JSON.stringify({ status: "skipped", reason: "No relevant text content" }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      });
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')?.trim();
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY missing");
    }

    // Call Gemini text-embedding-004
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: {
          parts: [{ text: textToEmbed }]
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API Error: ${errText}`);
    }

    const result = await response.json();
    const embedding = result.embedding?.values;

    if (!embedding || !Array.isArray(embedding)) {
      throw new Error("Invalid embedding response from Gemini");
    }

    // Update the record with the new embedding
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: updateError } = await supabase
      .from(table)
      .update({ embedding: `[${embedding.join(',')}]` })
      .eq('id', record.id);

    if (updateError) {
      throw new Error(`Supabase update error: ${updateError.message}`);
    }

    return new Response(JSON.stringify({ status: "success", table, id: record.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Generate Embeddings Exception:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500, 
    });
  }
});
