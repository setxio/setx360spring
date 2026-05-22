import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { record, table } = await req.json()

    // 1. Determine the text to embed based on the table
    let textToEmbed = ''
    if (table === 'profiles') {
      textToEmbed = `${record.first_name || ''} ${record.last_name || ''} ${record.bio || ''}`
    } else if (table === 'posts') {
      textToEmbed = `${record.content || ''}`
    } else if (table === 'stores') {
      textToEmbed = `${record.name || ''} ${record.description || ''} ${record.bio || ''}`
    } else if (table === 'events') {
      textToEmbed = `${record.title || ''} ${record.description || ''} ${record.location || ''}`
    }

    if (!textToEmbed.trim()) {
      return new Response(JSON.stringify({ message: "No text to embed" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // 2. Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. Generate Embedding using the built-in Session model
    // @supabase/ai requires setting up a session.
    const session = new (globalThis as any).Supabase.ai.Session('gte-small')
    const embeddingResult = await session.run(textToEmbed, {
      mean_pool: true,
      normalize: true,
    })

    // 4. Update the record
    const { error } = await supabaseClient
      .from(table)
      .update({ embedding: embeddingResult })
      .eq('id', record.id)

    if (error) throw error

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
