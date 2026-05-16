// =============================================================================
// SETX 360 — Phase 5: process-refund
// Called by Partner CSM POS when a merchant initiates a refund.
// Executes the RUTHLESS REFUND POLICY:
//   1. Refunds customer via Stripe (no application fee return)
//   2. Reverses the Stripe transfer back to the merchant
//   3. Claws back the original platform admin fee from the merchant's account
//   4. Records everything in the immutable fintech_ledger
// The platform NEVER loses its margin. Merchants absorb the fee cost.
// =============================================================================
// Endpoint Auth: Bearer {tenant_api_key} (same key as 360-bridge-receiver)
// Request Body:  { order_id, line_item_store_id, reason, merchant_note? }
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@16.0.0?target=deno";
import { createHash } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const incomingApiKey  = authHeader.replace("Bearer ", "").trim();
    const incomingKeyHash = createHash("sha256").update(incomingApiKey).digest("hex");

    const { data: tenant, error: tenantError } = await supabase
      .from("partner_csm_tenants")
      .select("id, tenant_slug, stripe_account_id, status, platform_fee_bps, platform_slug")
      .eq("api_key_hash", incomingKeyHash)
      .eq("status", "active")
      .single();

    if (tenantError || !tenant) {
      return new Response(JSON.stringify({ error: "Unauthorized tenant" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // -------------------------------------------------------------------------
    // 2. Select the correct Stripe Platform Keys
    // -------------------------------------------------------------------------
    const platform = tenant.platform_slug || "setx360";
    let stripeSecretKey = Deno.env.get(platform === "setxio" ? "STRIPE_IO_SECRET_KEY" : "STRIPE_360_SECRET_KEY");
    
    // Fallback to legacy env var
    if (!stripeSecretKey) stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (!stripeSecretKey) {
      return new Response(JSON.stringify({ error: `Stripe not configured for platform: ${platform}` }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" });

    // -------------------------------------------------------------------------
    // 2. Parse refund request
    // -------------------------------------------------------------------------
    const { order_id, line_item_store_id, reason, merchant_note } = await req.json();

    if (!order_id || !line_item_store_id) {
      return new Response(JSON.stringify({ error: "order_id and line_item_store_id are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // -------------------------------------------------------------------------
    // 3. Fetch the order and locate the specific vendor line item
    // -------------------------------------------------------------------------
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (order.status === "refunded") {
      return new Response(JSON.stringify({ error: "Order is already fully refunded" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find the specific vendor line item for this store
    const vendorLineItems: any[] = order.vendor_line_items || [];
    const lineItem = vendorLineItems.find((v: any) => v.store_id === line_item_store_id);

    if (!lineItem) {
      return new Response(
        JSON.stringify({ error: `Line item for store ${line_item_store_id} not found in order ${order_id}` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lineSubtotal = parseFloat(lineItem.subtotal) || 0;
    const feeBps       = order.platform_fee_bps || 500; // Use fee locked at time of order
    const platformFee  = Math.round(lineSubtotal * feeBps / 100); // In cents

    // Merchant's Stripe Connected Account
    const merchantStripeAccountId = lineItem.stripe_account_id || tenant.stripe_account_id;
    const stripeTransferId        = lineItem.stripe_transfer_id;
    const paymentIntentId         = order.stripe_payment_intent_id;

    if (!paymentIntentId) {
      return new Response(JSON.stringify({ error: "No Stripe payment intent on order. Cannot process refund." }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // -------------------------------------------------------------------------
    // 4. EXECUTE THE RUTHLESS REFUND POLICY
    //
    //    Step A: Refund the customer — DO NOT return the application fee
    //            (refund_application_fee: false) — platform keeps its cut
    //    Step B: Reverse the Stripe transfer — money goes back to platform
    //            from the merchant's connected account
    //    Step C: Clawback — debit the merchant's connected account for the
    //            exact platform fee amount. Platform margin is preserved.
    // -------------------------------------------------------------------------
    let refundResult: Stripe.Refund | null = null;
    let clawbackResult: Stripe.Charge | null = null;

    // STEP A: Customer Refund
    console.log(`💸 Refunding customer for order ${order_id} — line item subtotal: $${lineSubtotal}`);

    refundResult = await stripe.refunds.create({
      payment_intent:       paymentIntentId,
      amount:               Math.round(lineSubtotal * 100), // Convert to cents
      refund_application_fee: false,   // PLATFORM KEEPS ITS FEE — merchant eats this
      reverse_transfer:     true,       // Pull funds back from merchant's connected account
      reason:               "requested_by_customer",
      metadata: {
        order_id,
        store_id:     line_item_store_id,
        tenant_slug:  tenant.tenant_slug,
        merchant_note: merchant_note || "No note provided",
        refund_reason: reason || "merchant_initiated",
      },
    });

    console.log(`✅ Customer refund issued: ${refundResult.id} ($${lineSubtotal})`);

    // STEP C: Platform Fee Clawback — debit merchant's connected account
    //         We do this even after the transfer reversal to ensure 100% margin recovery
    if (merchantStripeAccountId && platformFee > 0) {
      console.log(`🔒 Clawing back platform fee from merchant: $${platformFee / 100} (${feeBps} bps)`);

      try {
        clawbackResult = await stripe.charges.create(
          {
            amount:   platformFee,
            currency: "usd",
            source:   merchantStripeAccountId,  // Debit from merchant's balance
            description: `SETX 360 Platform Fee Clawback — Order ${order_id} Refund`,
            metadata: {
              order_id,
              refund_id:    refundResult.id,
              fee_bps:      feeBps.toString(),
              tenant_slug:  tenant.tenant_slug,
            },
          },
          { stripeAccount: merchantStripeAccountId }
        );
        console.log(`✅ Merchant clawback charged: ${clawbackResult.id} ($${platformFee / 100})`);
      } catch (clawbackErr) {
        // Non-fatal — log it but don't fail the refund
        // The customer HAS been refunded. We'll flag this for manual recovery.
        console.error(`⚠️ Clawback FAILED for order ${order_id}:`, clawbackErr);
        // Insert a whisper insight to alert the merchant/admin
        await supabase.from("whisper_insights").insert({
          tenant_id:  tenant.id,
          title:      "Platform Fee Clawback Failed — Manual Action Required",
          body:       `A refund was issued for Order #${order_id} but the platform fee clawback of $${platformFee / 100} failed. Reason: ${clawbackErr.message}. Please contact the merchant or process manually.`,
          severity:   "critical",
        });
      }
    }

    // -------------------------------------------------------------------------
    // 5. Record in fintech_ledger (immutable audit trail)
    // -------------------------------------------------------------------------
    const transactionGroupId = crypto.randomUUID();

    await supabase.from("fintech_ledger").insert([
      {
        transaction_group_id: transactionGroupId,
        wallet_id:            null, // Platform-level transaction, no user wallet involved
        amount:               -(lineSubtotal), // Negative = debit (money leaving)
        type:                 "refund",
        description:          `Customer refund for Order ${order_id} — Store ${line_item_store_id}`,
        reference_id:         refundResult.id,
        metadata: {
          order_id,
          stripe_refund_id: refundResult.id,
          reason,
          tenant_slug: tenant.tenant_slug,
        },
      },
      ...(clawbackResult ? [{
        transaction_group_id: transactionGroupId,
        wallet_id:            null,
        amount:               platformFee / 100, // Positive = credit (fee recovered)
        type:                 "fee",
        description:          `Platform fee clawback recovered — Order ${order_id}`,
        reference_id:         clawbackResult.id,
        metadata: {
          order_id,
          stripe_charge_id: clawbackResult.id,
          fee_bps:          feeBps,
          tenant_slug:      tenant.tenant_slug,
        },
      }] : []),
    ]);

    // -------------------------------------------------------------------------
    // 6. Update the order status
    // -------------------------------------------------------------------------
    const allStoresRefunded = vendorLineItems.every((v: any) =>
      v.store_id === line_item_store_id || v.refunded === true
    );

    // Mark this specific line item as refunded in the JSONB
    const updatedLineItems = vendorLineItems.map((v: any) =>
      v.store_id === line_item_store_id ? { ...v, refunded: true, refund_id: refundResult!.id } : v
    );

    await supabase.from("orders").update({
      vendor_line_items: updatedLineItems,
      status:            allStoresRefunded ? "refunded" : "partially_refunded",
      updated_at:        new Date().toISOString(),
    }).eq("id", order_id);

    console.log(`✅ Refund complete for Order ${order_id} — Status: ${allStoresRefunded ? "refunded" : "partially_refunded"}`);

    return new Response(
      JSON.stringify({
        success:         true,
        refund_id:       refundResult.id,
        amount_refunded: lineSubtotal,
        platform_fee_recovered: platformFee / 100,
        clawback_id:     clawbackResult?.id || null,
        order_status:    allStoresRefunded ? "refunded" : "partially_refunded",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (err) {
    console.error("process-refund error:", err);
    return new Response(JSON.stringify({ error: "Refund processing error", detail: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
