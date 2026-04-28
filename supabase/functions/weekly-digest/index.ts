// Supabase Edge Function: weekly-digest
// Purpose: Every Sunday at 8AM, generate and publish AI community digest posts
// Reads top posts from last 7 days per community, asks Gemini to summarize

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('APP_SERVICE_KEY')!;
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const MIN_POSTS_FOR_DIGEST = 3;

async function generateDigest(community: string, county: string, state: string, posts: any[]): Promise<string> {
  if (!GEMINI_API_KEY) {
    // Fallback: simple template
    return `📍 This Week in ${community}: ${posts.length} new posts from your community. Topics include ${[...new Set(posts.map(p => p.ai_category))].join(', ')}. Stay connected with your neighbors on Efutura!`;
  }

  const postSummaries = posts
    .slice(0, 8)
    .map(p => `- [${p.ai_category}] ${p.content.slice(0, 120)}`)
    .join('\n');

  const prompt = `You are writing a friendly weekly community digest for a local social platform called Efutura.

Community: ${community}, ${county} County, ${state}
Top posts this week:
${postSummaries}

Write a 3-sentence community update in an upbeat, local news style. Reference specific topics people posted about. End with an encouraging call to action to keep posting. Keep it under 200 words. Do NOT use hashtags.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 250 },
      }),
    }
  );

  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 
    `📍 This Week in ${community}: ${posts.length} posts shared by your neighbors. Keep the conversation going!`;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get bot account (admin)
    const { data: bot } = await supabase
      .from('profiles').select('id, community, county, state').eq('role', 'admin').limit(1).single();

    if (!bot) throw new Error('No admin bot account found');

    // Get distinct active communities with post volume in last 7 days
    const { data: communities } = await supabase
      .from('posts')
      .select('author_community, author_county, author_state')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .neq('profile_id', bot.id)
      .not('author_community', 'is', null)
      .neq('moderation_status', 'hidden');

    if (!communities || communities.length === 0) {
      return new Response(JSON.stringify({ message: 'No active communities this week' }));
    }

    // Group by community
    const communityMap = new Map<string, { county: string; state: string; count: number }>();
    for (const row of communities) {
      const key = row.author_community;
      if (!communityMap.has(key)) {
        communityMap.set(key, { county: row.author_county || '', state: row.author_state || '', count: 0 });
      }
      communityMap.get(key)!.count++;
    }

    const digests: string[] = [];

    for (const [community, meta] of communityMap.entries()) {
      if (meta.count < MIN_POSTS_FOR_DIGEST) continue;

      // Fetch top posts for this community this week
      const { data: posts } = await supabase
        .from('posts')
        .select('content, ai_category, hot_score')
        .eq('author_community', community)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .neq('moderation_status', 'hidden')
        .neq('profile_id', bot.id)
        .order('hot_score', { ascending: false })
        .limit(8);

      if (!posts || posts.length < MIN_POSTS_FOR_DIGEST) continue;

      // Generate the digest
      const digestContent = await generateDigest(community, meta.county, meta.state, posts);
      const fullPost = `📍 Weekly Digest — ${community}\n\n${digestContent}`;

      // Publish as a community_news post from bot account
      await supabase.from('posts').insert({
        profile_id: bot.id,
        content: fullPost,
        type: 'text',
        location: community,
        author_community: community,
        author_county: meta.county,
        author_state: meta.state,
        author_country: 'USA',
        ai_category: 'community_news',
        ai_classified_at: new Date().toISOString(),
        moderation_status: 'clean',
        moderation_checked_at: new Date().toISOString(),
      });

      digests.push(community);
      console.log(`✅ Digest published for ${community}`);

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 500));
    }

    return new Response(
      JSON.stringify({ success: true, digests_published: digests.length, communities: digests }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('weekly-digest error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
