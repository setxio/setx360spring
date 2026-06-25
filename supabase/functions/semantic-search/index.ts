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
    const { query, scope_type, scope_value, platform } = await req.json()

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
      match_count: 30
    })

    if (error) throw error
    
    // Filter out non-christworx content if on christworx platform
    let filteredData = data || [];
    if (platform === 'christworx' && filteredData.length > 0) {
      // For posts, we need to verify they belong to christworx
      const postIds = filteredData.filter((d: any) => d.type === 'post').map((d: any) => d.id);
      
      let validPostIds = new Set<string>();
      if (postIds.length > 0) {
        const { data: postsData } = await supabaseClient
          .from('posts')
          .select('id, metadata')
          .in('id', postIds);
          
        if (postsData) {
          postsData.forEach((p: any) => {
            if (p.metadata?.platform === 'christworx') {
              validPostIds.add(p.id);
            }
          });
        }
      }
      
      // Filter out posts that are not verified as christworx
      filteredData = filteredData.filter((d: any) => {
        if (d.type === 'post') {
          return validPostIds.has(d.id);
        }
        // Assume other types (stores, events) might need similar filtering if they had metadata,
        // but for now we enforce strictly on posts as requested.
        return true;
      });
    }

    // 4. Group results to match existing global_search schema
    const results = {
      profiles: [] as any[],
      posts: [] as any[],
      stores: [] as any[],
      products: [] as any[],
      events: [] as any[],
      groups: [] as any[],
      wiki: [] as any[]
    }

    // Sort into groups based on type
    if (filteredData) {
      filteredData.forEach((item: any) => {
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
        if (item.type === 'group') results.groups.push(formattedItem)
        if (item.type === 'wiki') {
          results.wiki.push({ ...formattedItem, url: item.image_url, type: 'wiki' })
        } else if (item.type === 'wiki_profile' || item.type === 'wiki_event' || item.type === 'wiki_article') {
          results.wiki.push({ ...formattedItem, url: null, type: item.type })
        }


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
