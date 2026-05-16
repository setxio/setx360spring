// =============================================================================
// SETX 360 — inventory-sync
// Called by setx.io when a POS sale decrements stock on a product that is
// also synced to SETX 360 as a bridge_item.
// Atomically decrements bridge_item stock so the marketplace listing
// goes out-of-stock in near-real-time.
// =============================================================================
// setx.io fires this after its own decrement_stock RPC completes.
// Payload: { site_id, product_id, external_id, quantity_sold, remaining_stock }
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHash } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Authenticate via tenant API key
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const incomingApiKey  = authHeader.replace("Bearer ", "").trim();
    const incomingKeyHash = createHash("sha256").update(incomingApiKey).digest("hex");

    const { data: tenant } = await supabase
      .from("partner_csm_tenants")
      .select("id, tenant_slug, status")
      .eq("api_key_hash", incomingKeyHash)
      .eq("status", "active")
      .single();

    if (!tenant) {
      return new Response(JSON.stringify({ error: "Invalid API key" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const {
      product_id,       // setx.io products.id
      external_id,      // The external_id used when bridge item was created
      quantity_sold,
      remaining_stock,  // If provided, we SET instead of decrement (authoritative sync)
    } = await req.json();

    if (!product_id && !external_id) {
      return new Response(JSON.stringify({ error: "product_id or external_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (!quantity_sold && remaining_stock === undefined) {
      return new Response(JSON.stringify({ error: "quantity_sold or remaining_stock required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Find the bridge_item that corresponds to this setx.io product
    let bridgeItemQuery = supabase
      .from("bridge_items")
      .select("id, stock_quantity, track_inventory")
      .eq("tenant_id", tenant.id);

    if (external_id) {
      bridgeItemQuery = bridgeItemQuery.eq("external_id", external_id);
    } else {
      bridgeItemQuery = bridgeItemQuery.eq("external_id", product_id);
    }

    const { data: bridgeItem } = await bridgeItemQuery.single();

    if (!bridgeItem) {
      // Not every setx.io product has a bridge_item — that's fine
      return new Response(
        JSON.stringify({ success: true, synced: false, reason: "No bridge_item found for this product" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let syncResult: any;

    if (remaining_stock !== undefined) {
      // Authoritative SET — use the setx.io remaining_stock as ground truth
      const { error } = await supabase
        .from("bridge_items")
        .update({ stock_quantity: remaining_stock, track_inventory: true })
        .eq("id", bridgeItem.id);

      syncResult = { method: "set", remaining_stock, error: error?.message };
    } else {
      // Atomic decrement via RPC
      const { data: decrementResult, error: decrementError } = await supabase.rpc(
        "decrement_bridge_item_stock",
        { p_bridge_item_id: bridgeItem.id, p_quantity: quantity_sold }
      );

      syncResult = decrementResult || { success: false, error: decrementError?.message };
    }

    console.log(`📦 Inventory sync: [${tenant.tenant_slug}] product ${product_id} → bridge_item ${bridgeItem.id}`, syncResult);

    return new Response(
      JSON.stringify({ success: true, synced: true, bridge_item_id: bridgeItem.id, result: syncResult }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("inventory-sync error:", err);
    return new Response(JSON.stringify({ error: "Inventory sync error", detail: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
