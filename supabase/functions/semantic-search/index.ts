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
    const { query, scope_type, scope_value } = await req.json()

    if (!query) {
      return new Response(JSON.stringify({ profiles: [], posts: [], stores: [], events: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 1. Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // 2. Generate Embedding using the built-in Session model
    const session = new (globalThis as any).Supabase.ai.Session('gte-small')
    const embeddingResult = await session.run(query, {
      mean_pool: true,
      normalize: true,
    })

    // 3. Call the unified match RPC
    const { data, error } = await supabaseClient.rpc('match_universal', {
      query_embedding: embeddingResult,
      match_threshold: 0.75, // adjust based on model confidence
      match_count: 20
    })

    if (error) throw error

    // 4. Group results to match existing global_search schema
    const results = {
      profiles: [] as any[],
      posts: [] as any[],
      stores: [] as any[],
      products: [] as any[],
      events: [] as any[],
      wiki: [] as any[]
    }

    // Sort into groups based on type
    if (data) {
      data.forEach((item: any) => {
        // Map back to the expected structure in SearchOverlay
        const formattedItem = {
          id: item.id,
          name: item.title,
          title: item.title,
          content: item.description,
          description: item.description,
          avatar_url: item.image_url,
          image_url: item.image_url,
          image_urls: item.image_url ? [item.image_url] : [],
        }

        if (item.type === 'profile') results.profiles.push(formattedItem)
        if (item.type === 'post') results.posts.push(formattedItem)
        if (item.type === 'store') results.stores.push(formattedItem)
        if (item.type === 'event') results.events.push(formattedItem)
        if (item.type === 'product') results.products.push(formattedItem)
        if (item.type === 'wiki' || item.type === 'wiki_profile' || item.type === 'wiki_event') results.wiki.push({ ...formattedItem, url: item.id }) // url mapping depends on match_universal


      })
    }

    return new Response(JSON.stringify(results), {
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
