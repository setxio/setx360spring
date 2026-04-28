// Supabase Edge Function: consensus-alert
// Detects when multiple residents post about the same emergency
// Fires an unconfirmed community alert with mandatory disclaimer

import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('APP_SERVICE_KEY')!;
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

// Emergency keyword clusters
const EMERGENCY_PATTERNS = [
  {
    type: 'industrial',
    label: 'explosion or industrial incident',
    emoji: '🏭💥',
    windowMinutes: 15, // tighter window for industrial
    keywords: ['explosion', 'exploded', 'blast', 'boom', 'refinery', 'chemical', 'fumes', 'smell gas', 'gas leak', 'shelter', 'toxic', 'flare', 'fire at the plant', 'valero', 'total', 'motiva', 'exxon'],
  },
  {
    type: 'fire',
    label: 'fire or smoke',
    emoji: '🔥',
    windowMinutes: 20,
    keywords: ['fire', 'smoke', 'burning', 'flames', 'house fire', 'building fire', 'fire truck', 'fire department'],
  },
  {
    type: 'flood',
    label: 'flooding or rising water',
    emoji: '🌊',
    windowMinutes: 30,
    keywords: ['flooding', 'flooded', 'water rising', 'road flooded', 'high water', 'under water', 'flash flood', 'bayou overflow'],
  },
  {
    type: 'weather',
    label: 'severe weather',
    emoji: '🌪️',
    windowMinutes: 20,
    keywords: ['tornado', 'funnel cloud', 'rotation', 'severe storm', 'hurricane', 'wind damaged', 'trees down', 'power out'],
  },
  {
    type: 'police',
    label: 'active police or safety incident',
    emoji: '🚨',
    windowMinutes: 15,
    keywords: ['shooting', 'shots fired', 'active shooter', 'lockdown', 'crime scene', 'police everywhere', 'swat', 'accident bad', 'major crash'],
  },
];

const MIN_POSTS_FOR_ALERT = 3;

async function geminiCluster(posts: string[], type: string): Promise<{ confirmed: boolean; summary: string }> {
  if (!GEMINI_API_KEY) return { confirmed: true, summary: `Multiple residents reporting ${type}` };

  const prompt = `These are social media posts from residents in Southeast Texas. Do they all describe the same emergency event?

Posts:
${posts.slice(0, 8).map((p, i) => `${i + 1}. "${p.slice(0, 150)}"`).join('\n')}

Respond with ONLY valid JSON:
{"confirmed": true/false, "summary": "<one sentence describing what residents are reporting, max 15 words>"}

confirmed = true means these posts are clearly about the same emergency event.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1, maxOutputTokens: 80 } }),
      }
    );
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return JSON.parse(text);
  } catch {
    return { confirmed: true, summary: `Multiple residents reporting ${type}` };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, GET', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { data: bot } = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1).single();
    if (!bot) throw new Error('No admin bot found');

    const alertsFired: string[] = [];

    for (const pattern of EMERGENCY_PATTERNS) {
      const windowStart = new Date(Date.now() - pattern.windowMinutes * 60 * 1000).toISOString();

      // Find posts matching emergency keywords, grouped by community/county
      const { data: recentPosts } = await supabase
        .from('posts')
        .select('id, content, author_community, author_county, author_state, profile_id, created_at')
        .gte('created_at', windowStart)
        .neq('profile_id', bot.id)
        .neq('ai_category', 'official_alert')
        .neq('ai_category', 'community_alert')
        .neq('moderation_status', 'hidden');

      if (!recentPosts) continue;

      // Filter posts matching this pattern's keywords
      const matchingPosts = recentPosts.filter(post => {
        const text = post.content?.toLowerCase() || '';
        return pattern.keywords.some(kw => text.includes(kw));
      });

      if (matchingPosts.length < MIN_POSTS_FOR_ALERT) continue;

      // Group by county
      const countyGroups = new Map<string, any[]>();
      for (const post of matchingPosts) {
        const key = post.author_county || post.author_community || 'Unknown';
        if (!countyGroups.has(key)) countyGroups.set(key, []);
        countyGroups.get(key)!.push(post);
      }

      for (const [county, posts] of countyGroups.entries()) {
        if (posts.length < MIN_POSTS_FOR_ALERT) continue;

        // Dedup: don't fire if we already alerted this county for this type in last 4 hours
        const { data: recentAlert } = await supabase
          .from('posts')
          .select('id')
          .eq('ai_category', 'community_alert')
          .eq('author_county', county)
          .eq('profile_id', bot.id)
          .gte('created_at', new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString())
          .ilike('content', `%${pattern.type}%`)
          .limit(1);

        if (recentAlert && recentAlert.length > 0) continue;

        // Use Gemini to confirm these posts are about the same event
        const postTexts = posts.map(p => p.content);
        const cluster = await geminiCluster(postTexts, pattern.label);
        if (!cluster.confirmed) continue;

        const community = posts[0].author_community || county;
        const postCount = posts.length;

        // Build the community alert post
        const alertContent = [
          `${pattern.emoji} COMMUNITY ALERT — UNCONFIRMED`,
          ``,
          `${postCount} residents in ${community} are reporting: ${cluster.summary}`,
          ``,
          `📍 ${county} County, TX`,
          `⏰ Reports started: ${new Date(Math.min(...posts.map(p => new Date(p.created_at).getTime()))).toLocaleTimeString('en-US', { timeZone: 'America/Chicago', hour: '2-digit', minute: '2-digit' })} CST`,
          ``,
          `━━━━━━━━━━━━━━━━━━━━━━━`,
          `⚠️ DISCLAIMER: This is NOT an official emergency alert. This alert was generated from community posts and HAS NOT been verified by authorities. Monitor STAN (thestan.com) and official emergency channels for confirmed information.`,
          ``,
          `📻 Official alerts: thestan.com`,
          `📞 Emergency: 911`,
        ].join('\n');

        const { data: newPost } = await supabase.from('posts').insert({
          profile_id: bot.id,
          content: alertContent,
          type: 'announcement',
          ai_category: 'community_alert',
          ai_classified_at: new Date().toISOString(),
          moderation_status: 'clean',
          moderation_checked_at: new Date().toISOString(),
          author_county: county,
          author_state: 'TX',
          author_country: 'USA',
          author_community: community,
          visibility_scope: 'county',
        }).select('id').single();

        // Notify all users in this county
        if (newPost) {
          const { data: countyUsers } = await supabase
            .from('profiles')
            .select('id')
            .eq('county', county)
            .neq('id', bot.id);

          if (countyUsers && countyUsers.length > 0) {
            const notifs = countyUsers.map(u => ({
              recipient_id: u.id,
              sender_id: bot.id,
              type: 'community_alert',
              content: `${pattern.emoji} Community Alert (Unconfirmed): ${postCount} residents in ${community} reporting ${pattern.label}. NOT an official alert.`,
              reference_id: newPost.id,
            }));
            for (let i = 0; i < notifs.length; i += 100) {
              await supabase.from('notifications').insert(notifs.slice(i, i + 100));
            }
          }
        }

        alertsFired.push(`${pattern.type} in ${county} (${postCount} posts)`);
        console.log(`✅ Community alert fired: ${pattern.type} in ${county}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, alerts_fired: alertsFired.length, alerts: alertsFired }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('consensus-alert error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
