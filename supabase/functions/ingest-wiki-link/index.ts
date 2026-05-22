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
    const { url, type = 'general' } = await req.json()

    if (!url) {
      throw new Error('Missing URL parameter')
    }

    // 1. Fetch external page
    const pageResponse = await fetch(url)
    const html = await pageResponse.text()

    // 2. Parse HTML and extract content
    const $ = cheerio.load(html)
    
    // Remove scripts, styles, nav, footer to keep it clean
    $('script, style, nav, footer, header, aside').remove()
    
    const title = $('title').text().trim() || $('h1').first().text().trim() || url
    const description = $('meta[name="description"]').attr('content')?.trim() || ''
    
    // Extract paragraphs
    const paragraphs: string[] = []
    $('p').each((_, el) => {
      const text = $(el).text().trim()
      if (text.length > 20) {
        paragraphs.push(text)
      }
    })

    // Extract links for crawler
    const discoveredLinks: string[] = []
    const baseUrl = new URL(url)
    
    $('a').each((_, el) => {
      const href = $(el).attr('href')
      if (href) {
        try {
          // Resolve relative URLs using base domain
          const linkUrl = new URL(href, baseUrl.origin)
          
          // Only keep same-domain links, exclude fragments/anchors or weird schemas
          if (linkUrl.hostname === baseUrl.hostname && (linkUrl.protocol === 'http:' || linkUrl.protocol === 'https:')) {
            // Remove hash fragments to avoid crawling same page multiple times
            linkUrl.hash = ''
            discoveredLinks.push(linkUrl.toString())
          }
        } catch (e) {
          // invalid url, ignore
        }
      }
    })

    // Remove duplicates
    const uniqueLinks = [...new Set(discoveredLinks)]

    const rawContent = paragraphs.join('\n\n')
    // Take up to 2000 chars for embedding to fit into token limits safely
    const contentToEmbed = (title + ' ' + description + ' ' + rawContent).substring(0, 2000)

    // 3. Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Need service key to bypass RLS for inserting wiki entries
    )

    // 4. Generate Embedding
    const session = new (globalThis as any).Supabase.ai.Session('gte-small')
    const embeddingResult = await session.run(contentToEmbed, {
      mean_pool: true,
      normalize: true,
    })

    // 5. Insert into Database
    // Note: If you want to track who added it, pass the user token and extract `created_by`
    const authHeader = req.headers.get('Authorization')
    let userId = null
    if (authHeader) {
      // Create user-context client to get the user
      const userClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      )
      const { data: { user } } = await userClient.auth.getUser()
      userId = user?.id
    }

    const { data: insertedData, error } = await supabaseClient
      .from('search_wiki_entries')
      .insert({
        title,
        description,
        content: rawContent,
        url,
        type,
        embedding: embeddingResult,
        created_by: userId
      })
      .select()
      .single()

    if (error) throw error

    return new Response(JSON.stringify({ success: true, data: insertedData, links: uniqueLinks }), {
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
