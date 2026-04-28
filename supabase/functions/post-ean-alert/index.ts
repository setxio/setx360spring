// Supabase Edge Function: post-ean-alert
// Allows admins and verified officials to post manual EAN alerts at any scope
// Immediately notifies all users in the target scope

import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('APP_SERVICE_KEY')!;

const SCOPE_EMOJIS: Record<string, string> = {
  city: 'ℹ️',
  county: '⚠️',
  state: '🚨',
  national: '🆘',
};

const SEVERITY_EMOJIS: Record<string, string> = {
  info: 'ℹ️',
  warning: '⚠️',
  critical: '🚨',
};

Deno.serve(async (req: Request) => {
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
    const {
      title,
      content: alertContent,
      scope,          // 'city' | 'county' | 'state' | 'national'
      county,         // target county (for city/county scope)
      city,           // target city (for city scope)
      state,
      severity = 'warning',  // 'info' | 'warning' | 'critical'
      posterId,       // profile_id of the admin/official posting
      isTest = false,
    } = await req.json();

    if (!title || !alertContent || !scope) {
      return new Response(JSON.stringify({ error: 'title, content, and scope are required' }), { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Verify poster is admin or verified official
    const { data: poster } = await supabase
      .from('profiles')
      .select('id, name, role, community, county, state')
      .eq('id', posterId)
      .single();

    if (!poster) return new Response(JSON.stringify({ error: 'Poster not found' }), { status: 403 });
    const allowedRoles = ['admin', 'official', 'v_official'];
    if (!allowedRoles.includes(poster.role)) {
      return new Response(JSON.stringify({ error: 'Insufficient role to post EAN alerts' }), { status: 403 });
    }

    // Use admin bot for the actual post (to distinguish from personal posts)
    const { data: bot } = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1).single();
    const authorId = bot?.id || posterId;

    const scopeEmoji = SCOPE_EMOJIS[scope] || '⚠️';
    const sevEmoji = SEVERITY_EMOJIS[severity] || '⚠️';
    const scopeLabel = scope.toUpperCase();

    const formattedContent = [
      `${sevEmoji} EAN ${scopeLabel} ALERT${isTest ? ' — TEST MESSAGE' : ''}`,
      ``,
      title,
      ``,
      alertContent,
      ``,
      `📍 Scope: ${scope === 'city' && city ? city : scope === 'county' && county ? `${county} County` : scope === 'state' ? `State of ${state || 'Texas'}` : 'National'}`,
      `👤 Posted by: ${poster.name} (EAN Official)`,
      isTest ? `\n🔔 This is a test message. No emergency action required.` : '',
      ``,
      `📞 Emergency: 911 | 🌐 EAN: efutura.com`,
    ].filter(Boolean).join('\n').trim();

    // Insert post
    const { data: newPost, error: postError } = await supabase.from('posts').insert({
      profile_id: authorId,
      content: formattedContent,
      type: 'announcement',
      ai_category: 'official_alert',
      alert_scope: scope,
      moderation_status: 'clean',
      moderation_checked_at: new Date().toISOString(),
      ai_classified_at: new Date().toISOString(),
      author_county: county || poster.county,
      author_community: city || poster.community,
      author_state: state,
      author_country: 'USA',
      visibility_scope: scope,
    }).select('id').single();

    if (postError) throw postError;

    // Record in stan_alerts
    await supabase.from('stan_alerts').insert({
      guid: `ean-manual-${newPost!.id}`,
      title,
      content: alertContent,
      alert_type: 'ean_manual',
      severity: isTest ? 'test' : severity,
      alert_scope: scope,
      affected_counties: county ? [county] : [],
      source: 'EAN',
      posted_at: new Date().toISOString(),
      post_id: newPost!.id,
    });

    // Skip notifications for test messages
    if (!isTest) {
      let notifQuery = supabase.from('profiles').select('id').neq('id', authorId);

      if (scope === 'national') {
        // All users — no filter
      } else if (scope === 'state') {
        notifQuery = notifQuery.eq('state', state);
      } else if (scope === 'county' && county) {
        notifQuery = notifQuery.eq('county', county);
      } else if (scope === 'city' && city) {
        notifQuery = notifQuery.eq('community', city);
      }

      const { data: targets } = await notifQuery.limit(2000);
      if (targets && targets.length > 0) {
        console.log(`Notifying ${targets.length} users for ${scope} scope alert`);
        const notifs = targets.map(u => ({
          recipient_id: u.id,
          sender_id: authorId,
          type: 'official_alert',
          content: `${sevEmoji} EAN Alert: ${title.slice(0, 100)}`,
          reference_id: newPost!.id,
        }));
        for (let i = 0; i < notifs.length; i += 100) {
          await supabase.from('notifications').insert(notifs.slice(i, i + 100));
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        postId: newPost!.id,
        scope,
        isTest,
        message: isTest ? 'Test alert sent — no notifications dispatched' : `Alert dispatched at ${scope} scope`,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('post-ean-alert error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
