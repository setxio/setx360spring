// Supabase Edge Function: poll-stan
// Polls the public STAN RSS feed every 5 minutes
// Publishes new alerts as official posts + notifications to all county users

import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('APP_SERVICE_KEY')!;
const STAN_FEED_URL = 'https://thestan.com/feed/';

// Classify alert type from title/content
function classifyAlert(title: string, content: string): { type: string; severity: 'critical' | 'warning' | 'info' | 'test' } {
  const text = (title + ' ' + content).toLowerCase();

  if (text.match(/test|drill|exercise|scheduled/)) return { type: 'test', severity: 'test' };
  if (text.match(/evacuate|evacuation/)) return { type: 'evacuation', severity: 'critical' };
  if (text.match(/shelter.?in.?place|shelter in place/)) return { type: 'shelter_in_place', severity: 'critical' };
  if (text.match(/explosion|fire|blast|chemical|flare|refinery|industrial/)) return { type: 'industrial', severity: 'critical' };
  if (text.match(/tornado|hurricane|flood|storm|weather|severe/)) return { type: 'weather', severity: 'warning' };
  if (text.match(/shooting|active shooter|lockdown|armed/)) return { type: 'police', severity: 'critical' };
  if (text.match(/accident|crash|road closed|traffic|bridge/)) return { type: 'traffic', severity: 'info' };
  if (text.match(/boil water|water advisory|utility|power outage/)) return { type: 'utility', severity: 'warning' };
  return { type: 'general', severity: 'info' };
}

function severityEmoji(severity: string): string {
  switch (severity) {
    case 'critical': return '🚨';
    case 'warning': return '⚠️';
    case 'test': return '🔔';
    default: return 'ℹ️';
  }
}

// Simple but robust XML tag extractor — Deno/V8 safe
function getTag(xml: string, tag: string): string {
  // Try CDATA first
  const cdataRe = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i');
  const cdataMatch = xml.match(cdataRe);
  if (cdataMatch) return cdataMatch[1].trim();
  // Plain text
  const plainRe = new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`, 'i');
  const plainMatch = xml.match(plainRe);
  return plainMatch ? plainMatch[1].trim() : '';
}

// Minimal XML parser for RSS items — splits on </item> boundary
function parseRSSItems(xml: string): Array<{ guid: string; title: string; description: string; pubDate: string; link: string }> {
  const items: any[] = [];
  const parts = xml.split('<item>');
  for (let i = 1; i < parts.length; i++) {
    const itemXml = parts[i].split('</item>')[0];
    const guid = getTag(itemXml, 'guid') || getTag(itemXml, 'link');
    if (guid) {
      items.push({
        guid,
        title: getTag(itemXml, 'title'),
        description: getTag(itemXml, 'description'),
        pubDate: getTag(itemXml, 'pubDate'),
        link: getTag(itemXml, 'link'),
      });
    }
  }
  return items;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, GET', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get bot account
    const { data: bot } = await supabase.from('profiles').select('id, community, county, state').eq('role', 'admin').limit(1).single();
    if (!bot) throw new Error('No admin bot found');

    // Fetch STAN RSS
    const rssRes = await fetch(STAN_FEED_URL, { headers: { 'User-Agent': 'Efutura-SafetyMonitor/1.0' } });
    if (!rssRes.ok) throw new Error(`STAN RSS fetch failed: ${rssRes.status}`);
    const rssText = await rssRes.text();

    const items = parseRSSItems(rssText);
    console.log(`Parsed ${items.length} STAN items`);

    const newAlerts: string[] = [];

    for (const item of items) {
      // Check if already imported
      const { data: existing } = await supabase.from('stan_alerts').select('id').eq('guid', item.guid).limit(1);
      if (existing && existing.length > 0) continue;

      const classification = classifyAlert(item.title, item.description);
      const emoji = severityEmoji(classification.severity);
      const isTest = classification.severity === 'test';

      // Format post content
      const postContent = [
        `${emoji} OFFICIAL STAN ALERT`,
        ``,
        `${item.title}`,
        ``,
        item.description ? item.description.replace(/<[^>]+>/g, '').trim() : '',
        ``,
        `📍 Southeast Texas — Jefferson, Orange, Hardin & Jasper Counties`,
        `🔗 Full details: ${item.link || 'https://thestan.com'}`,
        isTest ? `\n(This is a scheduled test message — no emergency action required)` : '',
      ].filter(Boolean).join('\n').trim();

      // Create the post
      const { data: newPost } = await supabase.from('posts').insert({
        profile_id: bot.id,
        content: postContent,
        type: 'announcement',
        ai_category: 'official_alert',
        ai_classified_at: new Date().toISOString(),
        moderation_status: 'clean',
        moderation_checked_at: new Date().toISOString(),
        visibility_scope: 'county',
        author_county: 'Jefferson',
        author_state: 'TX',
        author_country: 'USA',
      }).select('id').single();

      // Record in stan_alerts table
      await supabase.from('stan_alerts').insert({
        guid: item.guid,
        title: item.title,
        content: item.description,
        alert_type: classification.type,
        severity: classification.severity,
        posted_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        post_id: newPost?.id || null,
        source_url: item.link,
      });

      // Send push notification to all county users (skip for test messages)
      if (!isTest && newPost) {
        const { data: countyUsers } = await supabase
          .from('profiles')
          .select('id')
          .in('county', ['Jefferson', 'Orange', 'Hardin', 'Jasper'])
          .neq('id', bot.id);

        if (countyUsers && countyUsers.length > 0) {
          const notifications = countyUsers.map(u => ({
            recipient_id: u.id,
            sender_id: bot.id,
            type: 'official_alert',
            content: `${emoji} STAN Alert: ${item.title}`,
            reference_id: newPost.id,
          }));

          // Batch insert (chunk to avoid payload limits)
          for (let i = 0; i < notifications.length; i += 100) {
            await supabase.from('notifications').insert(notifications.slice(i, i + 100));
          }
        }
      }

      newAlerts.push(item.title);
      console.log(`✅ Imported STAN alert: ${item.title}`);
    }

    return new Response(
      JSON.stringify({ success: true, new_alerts: newAlerts.length, titles: newAlerts }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('poll-stan error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
