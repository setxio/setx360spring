// Supabase Edge Function: poll-nws
// Polls NWS REST API for active weather alerts across Texas
// Free, no API key, full state coverage — every 5 minutes
// api.weather.gov/alerts/active?area=TX

import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('APP_SERVICE_KEY')!;
const NWS_API = 'https://api.weather.gov/alerts/active'; // National — all 50 states + territories
const USER_AGENT = 'Efutura-AlertNetwork/1.0 (contact@efutura.com)';

// Map severity/event to alert scope
function classifyScope(event: string, severity: string): 'city' | 'county' | 'state' | 'national' {
  const evt = event.toLowerCase();
  if (evt.match(/hurricane.*(warning|watch)|tropical storm warning|storm surge warning/)) return 'state';
  if (evt.match(/tornado warning|flash flood emergency|particularly dangerous situation/)) return 'county';
  if (severity === 'Extreme') return 'county';
  if (evt.match(/flood advisory|wind advisory|frost advisory|heat advisory|dense fog/)) return 'city';
  return 'county';
}

// Map NWS severity to EAN severity
function mapSeverity(nwsSeverity: string): string {
  switch (nwsSeverity) {
    case 'Extreme': return 'critical';
    case 'Severe': return 'critical';
    case 'Moderate': return 'warning';
    default: return 'info';
  }
}

// Emojis by event type
function alertEmoji(event: string, severity: string): string {
  const evt = event.toLowerCase();
  if (evt.includes('tornado')) return '🌪️';
  if (evt.includes('hurricane') || evt.includes('tropical')) return '🌀';
  if (evt.includes('flood')) return '🌊';
  if (evt.includes('thunderstorm')) return '⛈️';
  if (evt.includes('winter') || evt.includes('blizzard') || evt.includes('ice')) return '🌨️';
  if (evt.includes('heat')) return '🌡️';
  if (evt.includes('fire')) return '🔥';
  if (severity === 'Extreme' || severity === 'Severe') return '🚨';
  return '⚠️';
}

// Extract county/parish/borough names from NWS areaDesc (all states)
// NWS format: "Jefferson, TX; St. Tammany, LA; Anchorage Borough, AK"
const STATE_CODE_RE = /,\s*[A-Z]{2}$/;
function parseAffectedCounties(areaDesc: string): string[] {
  const counties: string[] = [];
  const parts = areaDesc.split(';');
  for (const part of parts) {
    const trimmed = part.trim();
    // Strip state code suffix if present: "Jefferson, TX" → "Jefferson"
    const withoutState = trimmed.replace(STATE_CODE_RE, '').trim();
    // Strip trailing descriptor words
    const clean = withoutState
      .replace(/\s+(County|Parish|Borough|Municipality|Census Area|City|Area)$/i, '')
      .trim();
    if (clean.length > 0) counties.push(clean);
  }
  // Fallback: split on commas
  if (counties.length === 0) {
    counties.push(...areaDesc.split(',').map(s => s.replace(STATE_CODE_RE, '').trim()).filter(Boolean).slice(0, 10));
  }
  return [...new Set(counties)]; // deduplicate
}

// Extract state code from NWS areaDesc for routing (e.g. "Jefferson, TX" → "TX")
function extractState(areaDesc: string): string {
  const parts = areaDesc.split(';');
  for (const part of parts) {
    const m = part.trim().match(/,\s*([A-Z]{2})$/);
    if (m) return m[1];
  }
  return 'US';
}

// Determine primary county and state for the post record
function getPrimaryLocation(counties: string[], areaDesc: string): { county: string | null; state: string } {
  return { county: counties[0] || null, state: extractState(areaDesc) };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, GET', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } });
  }

  try {
    // TEMPORARILY DISABLED BY REQUEST TO SAVE SPACE AND FOCUS ON SETX
    return new Response(JSON.stringify({ success: true, message: 'NWS Polling temporarily disabled' }), { headers: { 'Content-Type': 'application/json' } });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get bot
    const { data: bot } = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1).single();
    if (!bot) throw new Error('No admin bot found');

    // Fetch NWS active alerts for Texas
    const nwsRes = await fetch(NWS_API, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/geo+json',
      },
    });
    if (!nwsRes.ok) throw new Error(`NWS API error: ${nwsRes.status}`);
    const nwsData = await nwsRes.json();
    const features = nwsData.features || [];

    console.log(`NWS returned ${features.length} active TX alerts`);

    const imported: string[] = [];

    for (const feature of features) {
      const props = feature.properties;
      const alertId = feature.id || props.id;
      const severity = props.severity || 'Unknown';
      const event = props.event || 'Weather Alert';
      const headline = props.headline || event;
      const description = props.description || '';
      const instruction = props.instruction || '';
      const areaDesc = props.areaDesc || '';
      const sent = props.sent || new Date().toISOString();
      const expires = props.expires;

      // Skip minor/insignificant alerts
      if (['Minor', 'Unknown'].includes(severity)) continue;
      // Skip expired alerts
      if (expires && new Date(expires) < new Date()) continue;

      // Dedup check
      const { data: existing } = await supabase.from('stan_alerts').select('id').eq('guid', alertId).limit(1);
      if (existing && existing.length > 0) continue;

      const counties = parseAffectedCounties(areaDesc);
      const { county, state } = getPrimaryLocation(counties, areaDesc);
      const scope = classifyScope(event, severity);
      const eanSeverity = mapSeverity(severity);
      const emoji = alertEmoji(event, severity);

      // Build post content
      const content = [
        `${emoji} OFFICIAL NWS ALERT`,
        ``,
        `${headline}`,
        ``,
        description.split('\n').slice(0, 6).join('\n').trim(),
        instruction ? `\n📌 ${instruction.split('\n')[0].trim()}` : '',
        ``,
        `📍 Affected: ${areaDesc.split(';').slice(0, 4).join(', ')}${areaDesc.split(';').length > 4 ? '...' : ''}`,
        scope === 'state' ? `🚨 State-level alert for ${state}` : '',
        ``,
        `🔗 weather.gov | 📻 Monitor local radio | 📞 911 if emergency`,
      ].filter(Boolean).join('\n').trim();

      // Insert post
      const { data: newPost } = await supabase.from('posts').insert({
        profile_id: bot.id,
        content,
        type: 'announcement',
        ai_category: 'official_alert',
        ai_classified_at: new Date().toISOString(),
        alert_scope: scope,
        visibility_scope: scope,
        moderation_status: 'clean',
        moderation_checked_at: new Date().toISOString(),
        author_county: county,
        author_state: state,
        author_country: 'USA',
      }).select('id').single();

      // Record in stan_alerts
      await supabase.from('stan_alerts').insert({
        guid: alertId,
        title: headline,
        content: description.slice(0, 500),
        alert_type: event.toLowerCase().replace(' ', '_'),
        severity: eanSeverity,
        alert_scope: scope,
        affected_counties: counties.slice(0, 20),
        source: 'NWS',
        posted_at: sent,
        post_id: newPost?.id || null,
        source_url: `https://www.weather.gov`,
      });

      // Notify users based on scope
      if (newPost && eanSeverity !== 'info') {
        let notifQuery = supabase.from('profiles').select('id').neq('id', bot.id);

        if (scope === 'national') {
          // All users
        } else if (scope === 'state') {
          notifQuery = notifQuery.eq('state', state);
        } else if (scope === 'county' && county) {
          // Filter by both county and state to avoid cross-state name collisions
          notifQuery = notifQuery.eq('state', state).in('county', counties.length > 0 ? counties.slice(0, 10) : [county]);
        } else if (scope === 'city' && county) {
          notifQuery = notifQuery.eq('state', state).eq('county', county);
        }

        const { data: targets } = await notifQuery.limit(500);
        if (targets && targets.length > 0) {
          const notifs = targets.map(u => ({
            recipient_id: u.id,
            sender_id: bot.id,
            type: 'official_alert',
            content: `${emoji} NWS: ${headline.slice(0, 100)}`,
            reference_id: newPost.id,
          }));
          for (let i = 0; i < notifs.length; i += 100) {
            await supabase.from('notifications').insert(notifs.slice(i, i + 100));
          }
        }
      }

      imported.push(`${event} (${severity}) — ${county || 'TX'}`);
      console.log(`✅ NWS alert: ${event} [${severity}] — ${county}`);
      await new Promise(r => setTimeout(r, 200));
    }

    return new Response(
      JSON.stringify({ success: true, checked: features.length, imported: imported.length, alerts: imported }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('poll-nws error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
