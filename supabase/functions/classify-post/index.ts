// Supabase Edge Function: classify-post
// Runtime: Deno (deployed to Supabase Edge Functions)
// Purpose: Classify a post's content using Gemini Flash (with SQL fallback)
//
// Called via pg_net after every new post INSERT.
// Updates posts.ai_category and posts.ai_classified_at.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY'); // Optional — falls back to heuristic

const CATEGORIES = [
  'social',
  'buying_intent',
  'selling',
  'question',
  'event_sharing',
  'community_news',
  'prayer_request',
  'job_posting',
] as const;

type Category = typeof CATEGORIES[number];

/**
 * Heuristic fallback classifier — runs if no Gemini key is set.
 * Uses keyword patterns to make a best-guess categorization.
 */
function heuristicClassify(content: string): { category: Category; keyword: string | null } {
  const text = content.toLowerCase();

  const patterns: Array<{ category: Category; keywords: string[]; extractPattern?: RegExp }> = [
    {
      category: 'prayer_request',
      keywords: ['pray', 'prayer', 'lord', 'god', 'bless', 'church', 'bible', 'faith', 'amen'],
    },
    {
      category: 'buying_intent',
      keywords: ['looking for', 'need a', 'need an', 'where to buy', 'where can i find', 'anyone know a', 'recommend a', 'who sells', 'where to get', 'hiring a', 'want to hire', 'does anyone know'],
    },
    {
      category: 'selling',
      keywords: ['for sale', 'selling', 'dm me', 'contact me', 'available now', 'priced at', '$', 'obo', 'asking', 'must go'],
    },
    {
      category: 'job_posting',
      keywords: ['hiring', 'we are hiring', 'job opening', 'position available', 'apply now', 'send resume', 'full time', 'part time'],
    },
    {
      category: 'event_sharing',
      keywords: ['event', 'happening', 'join us', 'rsvp', 'this weekend', 'come out', 'live music', 'festival', 'rally', 'tonight'],
    },
    {
      category: 'community_news',
      keywords: ['breaking', 'update', 'announcement', 'alert', 'road closed', 'notice', 'reminder', 'be aware', 'news'],
    },
    {
      category: 'question',
      keywords: ['?', 'anyone know', 'what is', 'has anyone', 'can someone', 'how do i', 'thoughts on', 'opinion on'],
    },
  ];

  for (const { category, keywords } of patterns) {
    for (const kw of keywords) {
      if (text.includes(kw)) {
        // Try to extract a useful keyword (first noun after buying intent phrase)
        const extracted = kw.length > 4 ? kw : null;
        return { category, keyword: extracted };
      }
    }
  }

  return { category: 'social', keyword: null };
}

/**
 * Gemini-powered classifier.
 * Returns a structured JSON with category + extracted keyword.
 */
async function geminiClassify(content: string): Promise<{ category: Category; keyword: string | null }> {
  const prompt = `You are a content classifier for a local community social platform. Classify the following post into EXACTLY ONE of these categories:

social - casual conversation, updates, life events
buying_intent - looking to buy/hire/find something
selling - offering a product or service for sale
question - asking for advice, recommendations, or information
event_sharing - promoting or announcing an event
community_news - local news, alerts, public announcements
prayer_request - faith-based requests or content
job_posting - hiring or job opportunity

Also extract the main product/service keyword if the post has buying_intent or selling intent (else return null).

Post: """${content.slice(0, 500)}"""

Respond with ONLY valid JSON, no markdown:
{"category": "<one of the 8 categories>", "keyword": "<extracted keyword or null>"}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 64 },
      }),
    }
  );

  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

  try {
    const parsed = JSON.parse(text);
    const category = CATEGORIES.includes(parsed.category) ? parsed.category : 'social';
    return { category, keyword: parsed.keyword || null };
  } catch {
    return { category: 'social', keyword: null };
  }
}

Deno.serve(async (req: Request) => {
  // CORS for local dev
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { postId, content } = await req.json();

    if (!postId || !content) {
      return new Response(JSON.stringify({ error: 'postId and content required' }), { status: 400 });
    }

    // Classify — use Gemini if key is available, else fallback
    let result: { category: Category; keyword: string | null };
    if (GEMINI_API_KEY) {
      try {
        result = await geminiClassify(content);
      } catch (e) {
        console.warn('Gemini failed, using heuristic fallback:', e);
        result = heuristicClassify(content);
      }
    } else {
      result = heuristicClassify(content);
    }

    // Update the post in Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { error } = await supabase
      .from('posts')
      .update({
        ai_category: result.category,
        ai_extracted_keyword: result.keyword,
        ai_classified_at: new Date().toISOString(),
      })
      .eq('id', postId);

    if (error) {
      console.error('Supabase update error:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(
      JSON.stringify({ success: true, postId, ...result }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('classify-post error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
