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
    const { url, type = 'general', skipExisting = false } = await req.json()

    if (!url) {
      throw new Error('Missing URL parameter')
    }

    // Initialize Supabase client early for DB checks
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check if URL already exists
    const { data: existingEntry } = await supabaseClient
      .from('search_wiki_entries')
      .select('id')
      .eq('url', url)
      .maybeSingle()

    if (existingEntry && skipExisting) {
      // If we are skipping existing pages to save time/costs, return immediately.
      // We return empty links because we aren't fetching the HTML to discover new ones.
      return new Response(JSON.stringify({ success: true, skipped: true, data: existingEntry, links: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // 1. Fetch external page
    const pageResponse = await fetch(url)
    const html = await pageResponse.text()

    // 2. Parse HTML and extract content
    const $ = cheerio.load(html)
    
    // Remove scripts, styles, nav, footer to keep it clean
    $('script, style, nav, footer, header, aside').remove()
    
    // Extract paragraphs first to use as fallback description
    const paragraphs: string[] = []
    $('p').each((_, el) => {
      const text = $(el).text().trim()
      if (text.length > 20) {
        paragraphs.push(text)
      }
    })

    const title = $('title').text().trim() || $('meta[property="og:title"]').attr('content')?.trim() || $('h1').first().text().trim() || url
    
    let description = $('meta[name="description"]').attr('content')?.trim() || $('meta[property="og:description"]').attr('content')?.trim() || ''
    
    // If no description meta tag exists, use the first paragraph as a fallback
    if (!description && paragraphs.length > 0) {
      description = paragraphs[0].substring(0, 200) + (paragraphs[0].length > 200 ? '...' : '')
    }

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

    // We already initialized supabaseClient above

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

    let dbResult;
    if (existingEntry) {
      // Update existing entry instead of creating duplicates
      dbResult = await supabaseClient
        .from('search_wiki_entries')
        .update({
          title,
          description,
          content: rawContent,
          type,
          embedding: embeddingResult,
          created_by: userId
        })
        .eq('id', existingEntry.id)
        .select()
        .single()
    } else {
      // Insert new entry
      dbResult = await supabaseClient
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
    }

    const { data: insertedData, error } = dbResult;

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
