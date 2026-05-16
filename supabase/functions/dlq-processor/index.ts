// =============================================================================
// SETX 360 — Phase 6: dlq-processor
// Scheduled cron function that retries failed Partner CSM webhook deliveries.
// Schedule: Every 10 minutes (set in supabase/functions/cron config or pg_cron)
//
// Algorithm:
//   1. Fetch all DLQ entries where next_retry_at <= NOW() and status = 'pending'/'retrying'
//   2. For each entry, attempt to re-deliver the payload to the tenant's POS endpoint
//   3. On success: mark 'resolved'
//   4. On failure (attempt < max_attempts): increment count, set next_retry_at (exponential backoff)
//   5. On final failure (attempt >= max_attempts): mark 'abandoned', generate Whisper Insight
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Exponential backoff intervals: attempt 1 → 2min, 2 → 15min, 3 → abandoned
const BACKOFF_INTERVALS_MINUTES = [2, 15];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    console.log("🔄 DLQ Processor starting...");

    // -------------------------------------------------------------------------
    // 1. Fetch all DLQ entries ready for retry
    // -------------------------------------------------------------------------
    const now = new Date().toISOString();

    const { data: dlqEntries, error: fetchError } = await supabase
      .from("webhook_dlq")
      .select(`
        id,
        order_id,
        tenant_id,
        payload,
        attempt_count,
        max_attempts,
        partner_csm_tenants (
          id,
          tenant_slug,
          webhook_endpoint,
          status
        )
      `)
      .in("status", ["pending", "retrying"])
      .lte("next_retry_at", now)
      .limit(50); // Process max 50 per cycle to avoid timeouts

    if (fetchError) {
      throw new Error(`Failed to fetch DLQ entries: ${fetchError.message}`);
    }

    if (!dlqEntries || dlqEntries.length === 0) {
      console.log("✅ DLQ is empty — no retries needed.");
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: "DLQ is clear" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📬 Found ${dlqEntries.length} DLQ entries to process.`);

    const results = { resolved: 0, retryScheduled: 0, abandoned: 0, errors: 0 };

    // -------------------------------------------------------------------------
    // 2. Process each DLQ entry
    // -------------------------------------------------------------------------
    for (const entry of dlqEntries) {
      const tenant = entry.partner_csm_tenants as any;

      if (!tenant || tenant.status !== "active") {
        // Tenant is gone or suspended — abandon without notification
        await supabase.from("webhook_dlq").update({
          status: "abandoned",
          resolved_at: new Date().toISOString(),
          resolution_note: "Tenant no longer active — entry abandoned automatically.",
        }).eq("id", entry.id);
        results.abandoned++;
        continue;
      }

      // Retrieve API key from Vault via RPC (fully automated — no env vars needed)
      const { data: tenantApiKey, error: vaultKeyError } = await supabase.rpc(
        "get_csm_api_key",
        { p_tenant_slug: tenant.tenant_slug }
      );

      if (vaultKeyError || !tenantApiKey) {
        console.warn(`No API key found in Vault for tenant ${tenant.tenant_slug}: ${vaultKeyError?.message}`);
        results.errors++;
        continue;
      }

      // -----------------------------------------------------------------------
      // 3. Attempt re-delivery
      // -----------------------------------------------------------------------
      let deliverySuccess = false;
      let lastError = "";

      try {
        const response = await fetch(tenant.webhook_endpoint, {
          method: "POST",
          headers: {
            "Content-Type":        "application/json",
            "Authorization":       `Bearer ${tenantApiKey}`,
            "X-SETX360-DLQ-Retry": `attempt-${entry.attempt_count + 1}`,
            "X-SETX360-Source":    "setx360-dlq-processor",
          },
          body: JSON.stringify({
            ...entry.payload,
            _dlq_retry: true,
            _dlq_attempt: entry.attempt_count + 1,
          }),
          signal: AbortSignal.timeout(8000), // 8s timeout
        });

        if (response.ok) {
          deliverySuccess = true;
        } else {
          lastError = `HTTP ${response.status}: ${await response.text().then(t => t.slice(0, 200))}`;
        }
      } catch (deliveryErr) {
        lastError = String(deliveryErr).slice(0, 300);
      }

      // -----------------------------------------------------------------------
      // 4. Handle result
      // -----------------------------------------------------------------------
      if (deliverySuccess) {
        // SUCCESS — mark resolved
        await supabase.from("webhook_dlq").update({
          status:          "resolved",
          resolved_at:     new Date().toISOString(),
          resolution_note: `Successfully re-delivered on attempt ${entry.attempt_count + 1}`,
        }).eq("id", entry.id);

        console.log(`✅ DLQ resolved: ${entry.id} → ${tenant.tenant_slug} (attempt ${entry.attempt_count + 1})`);
        results.resolved++;

      } else if (entry.attempt_count >= entry.max_attempts) {
        // FINAL FAILURE — abandon and generate Whisper Insight
        await supabase.from("webhook_dlq").update({
          status:          "abandoned",
          attempt_count:   entry.attempt_count + 1,
          last_error:      lastError,
          resolved_at:     new Date().toISOString(),
          resolution_note: `Max retries (${entry.max_attempts}) exhausted. Manual intervention required.`,
        }).eq("id", entry.id);

        // Generate Whisper Insight for the merchant
        const orderId  = entry.order_id;
        const itemInfo = entry.payload?.items
          ? entry.payload.items.map((i: any) => i.name || i.id).join(", ")
          : "unknown items";

        await supabase.from("whisper_insights").insert({
          tenant_id:    tenant.id,
          title:        `⚠️ Sync Failure — Order ${orderId ? `#${orderId.slice(0, 8)}` : "Unknown"} Requires Manual Processing`,
          body:         [
            `A webhook delivery to your POS terminal failed after ${entry.max_attempts} attempts.`,
            ``,
            `Order ID: ${orderId || "N/A"}`,
            `Items: ${itemInfo}`,
            `Last Error: ${lastError}`,
            ``,
            `ACTION REQUIRED: Please manually verify this order in your POS system and fulfill it. `,
            `If your POS terminal is offline, bring it back online and contact support@setx360.com with the order ID.`,
          ].join("\n"),
          severity:     "critical",
          insight_type: "sync_failure",
          action_url:   orderId ? `/dashboard/orders/${orderId}` : `/dashboard/orders`,
          action_label: "Review Order",
        });

        console.log(`🚨 DLQ abandoned: ${entry.id} → ${tenant.tenant_slug} — Whisper Insight created`);
        results.abandoned++;

      } else {
        // RETRY SCHEDULED — exponential backoff
        const nextAttemptIdx  = Math.min(entry.attempt_count, BACKOFF_INTERVALS_MINUTES.length - 1);
        const backoffMinutes  = BACKOFF_INTERVALS_MINUTES[nextAttemptIdx];
        const nextRetry       = new Date(Date.now() + backoffMinutes * 60 * 1000).toISOString();

        await supabase.from("webhook_dlq").update({
          status:        "retrying",
          attempt_count: entry.attempt_count + 1,
          last_error:    lastError,
          next_retry_at: nextRetry,
        }).eq("id", entry.id);

        console.log(`🔁 DLQ retry scheduled: ${entry.id} → ${tenant.tenant_slug} in ${backoffMinutes}min (attempt ${entry.attempt_count + 1}/${entry.max_attempts})`);
        results.retryScheduled++;
      }
    }

    // -------------------------------------------------------------------------
    // 5. Return summary
    // -------------------------------------------------------------------------
    console.log(`📊 DLQ run complete:`, results);

    return new Response(
      JSON.stringify({
        success:   true,
        processed: dlqEntries.length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("dlq-processor error:", err);
    return new Response(JSON.stringify({ error: "DLQ processor error", detail: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
