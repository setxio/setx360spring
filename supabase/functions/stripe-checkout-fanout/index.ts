// =============================================================================
// SETX 360 — stripe-checkout-fanout (Enhanced with Split Payments)
// Receives Stripe webhook: checkout.session.completed
// 1. Marks order complete
// 2. Fires parallel POSTs to Partner CSM nodes
// 3. Executes Stripe Transfers to vendors (Split Payments)
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@16.0.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const PLAN_FEE_MAP: Record<string, number> = {
  "free": 1000,       // 10%
  "starter": 500,     // 5%
  "pro": 300,         // 3%
  "enterprise": 150,  // 1.5%
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const url = new URL(req.url);
  const platform = url.searchParams.get("platform") || "setx360";

  let stripeSecretKey = Deno.env.get(platform === "setxio" ? "STRIPE_IO_SECRET_KEY" : "STRIPE_360_SECRET_KEY");
  let webhookSecret = Deno.env.get(platform === "setxio" ? "STRIPE_IO_WEBHOOK_SECRET" : "STRIPE_360_WEBHOOK_SECRET");

  // Fallback to legacy env vars if new ones aren't set yet
  if (!stripeSecretKey) stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!webhookSecret) webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!stripeSecretKey || !webhookSecret) {
    return new Response(`Stripe not configured for platform: ${platform}`, { status: 503 });
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" });

  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  const rawBody = await req.text();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (err) {
    return new Response(`Webhook error: ${err.message}`, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const orderId = session.metadata?.order_id;

  if (!orderId) return new Response("No order_id", { status: 200 });

  // 1. Fetch Order & Vendor Data
  const { data: order, error: orderError } = await supabase.from("orders").select("*").eq("id", orderId).single();
  if (orderError || !order) return new Response("Order not found", { status: 404 });

  const vendorLineItems = order.vendor_line_items || [];
  const tenantIds = [...new Set(vendorLineItems.map((v: any) => v.csm_tenant_id))];

  // 2. Fetch Tenants & Their Subscriptions for Fee Calculation
  const { data: tenants } = await supabase
    .from("partner_csm_tenants")
    .select("id, tenant_slug, webhook_endpoint, stripe_account_id")
    .in("id", tenantIds);

  const { data: subscriptions } = await supabase
    .from("merchant_subscriptions")
    .select("store_id, plan")
    .in("store_id", vendorLineItems.map((v: any) => v.store_id));

  const tenantMap = Object.fromEntries(tenants?.map((t) => [t.id, t]) || []);
  const subMap = Object.fromEntries(subscriptions?.map((s) => [s.store_id, s.plan]) || []);

  // 3. Fire Fan-Out Webhooks
  const fanOutResults = await Promise.allSettled(
    vendorLineItems.map(async (vendorGroup: any) => {
      const tenant = tenantMap[vendorGroup.csm_tenant_id];
      if (!tenant) return;

      const { data: tenantApiKey } = await supabase.rpc("get_csm_api_key", { p_tenant_slug: tenant.tenant_slug });
      
      return fetch(tenant.webhook_endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${tenantApiKey}`,
        },
        body: JSON.stringify({
          event: "order.created",
          order_id: orderId,
          subtotal: vendorGroup.subtotal,
          items: vendorGroup.items,
          customer: { name: session.customer_details?.name, email: session.customer_details?.email }
        }),
      });
    })
  );

  // 4. Execute Stripe Transfers (Split Payments)
  const transferResults = await Promise.allSettled(
    vendorLineItems.map(async (vendorGroup: any) => {
      const tenant = tenantMap[vendorGroup.csm_tenant_id];
      if (!tenant?.stripe_account_id) return;

      const plan = subMap[vendorGroup.store_id] || "free";
      const feeBps = PLAN_FEE_MAP[plan] || 1000;
      
      const subtotalCents = Math.round(vendorGroup.subtotal * 100);
      const feeCents = Math.round(subtotalCents * (feeBps / 10000));
      const transferAmount = subtotalCents - feeCents;

      if (transferAmount <= 0) return;

      return stripe.transfers.create({
        amount: transferAmount,
        currency: order.currency?.toLowerCase() || "usd",
        destination: tenant.stripe_account_id,
        transfer_group: `order_${orderId}`,
        metadata: { order_id: orderId, store_id: vendorGroup.store_id }
      });
    })
  );

  // 5. Final Status Update
  await supabase.from("orders").update({
    status: "completed",
    stripe_payment_intent_id: session.payment_intent as string,
    fan_out_status: "complete",
    updated_at: new Date().toISOString(),
  }).eq("id", orderId);

  return new Response(JSON.stringify({ success: true, orderId }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
