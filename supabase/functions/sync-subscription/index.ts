// =============================================================================
// SETX 360 — sync-subscription
// Called by setx.io when a merchant's subscription plan changes.
// Updates merchant_subscriptions on SETX 360 so feature gates stay current.
// Also updates the partner_csm_tenants.platform_fee_bps based on plan
// (enterprise merchants may get reduced platform fees as an incentive).
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Platform fee schedule by plan tier (in basis points)
// Enterprise merchants get a lower platform fee as a loyalty incentive
const PLATFORM_FEE_BY_PLAN: Record<string, number> = {
  free:       500,  // 5.0%
  starter:    500,  // 5.0%
  pro:        400,  // 4.0%
  enterprise: 250,  // 2.5%
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const {
      tenant_id,
      site_id,
      plan,
      status,
      stripe_customer_id,
      stripe_subscription_id,
      current_period_start,
      current_period_end,
      changed_at,
    } = await req.json();

    if (!tenant_id || !plan) {
      return new Response(JSON.stringify({ error: "tenant_id and plan are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const validPlans = ["free", "starter", "pro", "enterprise"];
    if (!validPlans.includes(plan)) {
      return new Response(JSON.stringify({ error: `Invalid plan: ${plan}. Valid: ${validPlans.join(", ")}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // -------------------------------------------------------------------------
    // 1. Update merchant_subscriptions
    // -------------------------------------------------------------------------
    const { error: subError } = await supabase
      .from("merchant_subscriptions")
      .update({
        plan,
        status:                 status || "active",
        stripe_customer_id:     stripe_customer_id || null,
        stripe_subscription_id: stripe_subscription_id || null,
        current_period_start:   current_period_start || null,
        current_period_end:     current_period_end || null,
        last_synced_at:         new Date().toISOString(),
        sync_source:            "setxio_plan_change",
      })
      .eq("tenant_id", tenant_id);

    if (subError) {
      console.error("Failed to update merchant_subscription:", subError);
      // Don't fail — try to update the tenant record at minimum
    }

    // -------------------------------------------------------------------------
    // 2. Update partner_csm_tenants platform fee based on new plan
    // -------------------------------------------------------------------------
    const newFeeBps = PLATFORM_FEE_BY_PLAN[plan] ?? 500;

    const { error: tenantError } = await supabase
      .from("partner_csm_tenants")
      .update({ platform_fee_bps: newFeeBps })
      .eq("id", tenant_id);

    if (tenantError) {
      console.error("Failed to update tenant platform_fee_bps:", tenantError);
    }

    // -------------------------------------------------------------------------
    // 3. Log a Whisper Insight to notify the merchant of the plan change
    // -------------------------------------------------------------------------
    const planEmoji: Record<string, string> = {
      free: "🆓", starter: "🚀", pro: "⭐", enterprise: "👑"
    };

    await supabase.from("whisper_insights").insert({
      tenant_id,
      title:        `${planEmoji[plan] || ""} Subscription Updated to ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
      body:         [
        `Your SETX 360 marketplace features have been updated to match your ${plan} plan.`,
        ``,
        `New platform fee rate: ${(newFeeBps / 100).toFixed(1)}% per transaction.`,
        status === "cancelled"
          ? `\n⚠️ Your subscription has been cancelled. Your marketplace listing will remain active until the end of your current billing period.`
          : status === "past_due"
          ? `\n⚠️ Your payment is past due. Please update your billing information to avoid service interruption.`
          : `\nThank you for your continued partnership with SETX 360!`,
      ].join("\n"),
      severity:     status === "cancelled" || status === "past_due" ? "warning" : "info",
      insight_type: "system_alert",
      action_url:   "/dashboard/billing",
      action_label: "View Billing",
    });

    console.log(`✅ Subscription synced: tenant ${tenant_id} → plan: ${plan}, status: ${status}, fee: ${newFeeBps}bps`);

    return new Response(
      JSON.stringify({ success: true, tenant_id, plan, platform_fee_bps: newFeeBps }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("sync-subscription error:", err);
    return new Response(JSON.stringify({ error: "Sync error", detail: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
