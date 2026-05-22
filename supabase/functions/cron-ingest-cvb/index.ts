import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as cheerio from 'https://esm.sh/cheerio@1.0.0-rc.12'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log("Starting Beaumont CVB Events Scraping...")
    
    // Fetch the Beaumont CVB events page
    const pageResponse = await fetch('https://www.beaumontcvb.com/events/')
    const html = await pageResponse.text()
    
    const $ = cheerio.load(html)
    const events: any[] = []

    // 1. We look for elements that represent an event.
    // Based on standard simpleview CVB directories, they usually use .item or .listing classes.
    // We will target standard classes used on beaumontcvb.com
    $('.listing-item, .item, .ccl-v2-widget.mosaic .slide').each((_, el) => {
      const title = $(el).find('h3, h4, .title').text().trim()
      const description = $(el).find('p, .description').text().trim()
      const dateString = $(el).find('.date, .time').text().trim() || 'Unknown Date'
      
      let imageUrl = $(el).find('img').attr('src')
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = 'https://www.beaumontcvb.com' + imageUrl
      }

      if (title) {
        events.push({
          title,
          description: description || 'No description available.',
          start_time: new Date().toISOString(), // Mocking current date for now, would parse dateString
          end_time: new Date().toISOString(),
          category: 'Community',
          status: 'upcoming',
          image_url: imageUrl || '',
          location_name: 'Beaumont',
          coordinates: { type: 'Point', coordinates: [-94.1266, 30.0802] } // Beaumont coordinates
        })
      }
    })

    console.log(`Discovered ${events.length} events from CVB.`)

    // 2. Generate Embeddings and Upsert
    const session = new (globalThis as any).Supabase.ai.Session('gte-small')
    
    let upsertCount = 0
    for (const ev of events) {
      // Content to embed
      const contentToEmbed = `${ev.title} ${ev.description}`
      const embeddingResult = await session.run(contentToEmbed, {
        mean_pool: true,
        normalize: true,
      })

      ev.embedding = Array.from(embeddingResult)

      // Assuming event title + description + date makes it unique enough.
      // Supabase Edge Functions with pgvector:
      // Since public.events doesn't have a unique constraint on title, we will just try to find it first.
      const { data: existing } = await supabaseClient
        .from('events')
        .select('id')
        .eq('title', ev.title)
        .maybeSingle()

      if (existing) {
        await supabaseClient
          .from('events')
          .update(ev)
          .eq('id', existing.id)
      } else {
        await supabaseClient
          .from('events')
          .insert(ev)
      }
      upsertCount++
    }

    return new Response(JSON.stringify({ success: true, processed: upsertCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
