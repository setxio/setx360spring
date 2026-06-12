import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    // We use the service role key to bypass RLS and hard-delete the rows
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate timestamp for exactly 90 days ago
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const purgeDateStr = ninetyDaysAgo.toISOString();

    // 1. Fetch users with an active forensic freeze
    const { data: frozenProfiles, error: profileErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('forensic_freeze', true);

    if (profileErr) throw profileErr;
    const frozenUserIds = frozenProfiles?.map((p: any) => p.id) || [];

    // 2. Build the query to delete classified_items
    let itemsQuery = supabase
      .from('classified_items')
      .delete()
      .not('deleted_at', 'is', null)
      .lt('deleted_at', purgeDateStr);

    // If there are frozen accounts, exclude their items from being purged
    if (frozenUserIds.length > 0) {
      itemsQuery = itemsQuery.not('user_id', 'in', `(${frozenUserIds.join(',')})`);
    }

    const { error: itemsErr } = await itemsQuery;
    if (itemsErr) throw itemsErr;

    // 3. Build the query to delete classified_events
    let eventsQuery = supabase
      .from('classified_events')
      .delete()
      .not('deleted_at', 'is', null)
      .lt('deleted_at', purgeDateStr);

    // Exclude frozen accounts
    if (frozenUserIds.length > 0) {
      eventsQuery = eventsQuery.not('user_id', 'in', `(${frozenUserIds.join(',')})`);
    }

    const { error: eventsErr } = await eventsQuery;
    if (eventsErr) throw eventsErr;

    return new Response(JSON.stringify({
      message: "90-Day Forensics Purge Completed Successfully",
      purged_before: purgeDateStr,
      frozen_accounts_skipped: frozenUserIds.length
    }), { headers: { "Content-Type": "application/json" } });

  } catch (error: any) {
    console.error("Purge Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
