// =============================================================================
// SETX 360 — Phase 3: 360-bridge-receiver
// Receives inventory pushes FROM Partner CSM nodes.
// Validates tenant API key → maps data → quarantines → generates embeddings.
// Partner CSM pushes; SETX 360 pulls into the master catalog.
// =============================================================================
// Request Format (POST body):
//   {
//     "type": "product" | "menu_item" | "service_block",
//     "store_id": "uuid",
//     "data": {
//       "name": "...",
//       "description": "...",
//       "price": 12.99,
//       "external_id": "shopify_12345",        // for dedup
//       "external_source": "shopify",
//       "image_urls": ["https://..."],
//       // retail-specific:
//       "sku": "...", "barcode": "...", "stock_quantity": 10, "variants": [...]
//       // menu-specific:
//       "modifiers": [...], "category": "...", "allergens": [...], "prep_time_min": 15
//       // service-specific:
//       "duration_min": 60, "availability_blocks": [...], "service_area": "..."
//     }
//   }
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHash } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Maps incoming CSM payload types to bridge_item_type values
const ITEM_TYPE_MAP: Record<string, "retail" | "menu" | "service"> = {
  product:       "retail",
  retail:        "retail",
  menu_item:     "menu",
  menu:          "menu",
  service_block: "service",
  service:       "service",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const geminiApiKey = Deno.env.get("GEMINI_API_KEY")?.trim();

  try {
    // -------------------------------------------------------------------------
    // 1. Authenticate the Partner CSM tenant via Bearer API key
    // -------------------------------------------------------------------------
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing or invalid Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const incomingApiKey = authHeader.replace("Bearer ", "").trim();

    // Hash the incoming key — we only store hashes, never plaintext keys
    const incomingKeyHash = createHash("sha256").update(incomingApiKey).digest("hex");

    const { data: tenant, error: tenantError } = await supabase
      .from("partner_csm_tenants")
      .select("id, tenant_slug, status, platform_fee_bps")
      .eq("api_key_hash", incomingKeyHash)
      .eq("status", "active")
      .single();

    if (tenantError || !tenant) {
      console.warn("Bridge receiver: unauthorized attempt with key hash:", incomingKeyHash.slice(0, 8) + "...");
      return new Response(JSON.stringify({ error: "Invalid API key or tenant suspended" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // -------------------------------------------------------------------------
    // 2. Parse and validate the incoming payload
    // -------------------------------------------------------------------------
    const body = await req.json();
    const { type, store_id, data } = body;

    if (!type || !data || !data.name) {
      return new Response(JSON.stringify({ error: "Invalid payload: type, store_id, and data.name are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const itemType = ITEM_TYPE_MAP[type];
    if (!itemType) {
      return new Response(JSON.stringify({ error: `Unknown item type: ${type}. Valid: product, menu_item, service_block` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If store_id provided, verify it belongs to this tenant
    if (store_id) {
      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("id", store_id)
        .eq("csm_tenant_id", tenant.id)
        .single();

      if (!store) {
        return new Response(JSON.stringify({ error: "store_id does not belong to this tenant" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // -------------------------------------------------------------------------
    // 3. Map the incoming data to the Polymorphic JSONB Item Schema
    // -------------------------------------------------------------------------
    let metadata: Record<string, any> = {};

    if (itemType === "retail") {
      metadata = {
        sku:            data.sku,
        barcode:        data.barcode,
        stock_quantity: data.stock_quantity,
        variants:       data.variants || [],
        images:         data.image_urls || [],
        weight:         data.weight,
        dimensions:     data.dimensions,
      };
    } else if (itemType === "menu") {
      metadata = {
        modifiers:    data.modifiers || [],
        category:     data.category,
        allergens:    data.allergens || [],
        prep_time_min: data.prep_time_min,
        is_available: data.is_available !== false,
        images:       data.image_urls || [],
        calories:     data.calories,
      };
    } else if (itemType === "service") {
      metadata = {
        duration_min:         data.duration_min,
        availability_blocks:  data.availability_blocks || [],
        service_area:         data.service_area,
        booking_url:          data.booking_url,
        requires_deposit:     data.requires_deposit || false,
        deposit_amount:       data.deposit_amount,
      };
    }

    // -------------------------------------------------------------------------
    // 4. Insert into bridge_items with status = 'pending_moderation'
    //    Use UPSERT to handle re-syncs gracefully (idempotent)
    // -------------------------------------------------------------------------
    const bridgeItemPayload = {
      tenant_id:       tenant.id,
      store_id:        store_id || null,
      item_type:       itemType,
      name:            data.name,
      description:     data.description || null,
      price:           data.price ? parseFloat(data.price) : null,
      currency:        data.currency || "USD",
      metadata:        metadata,
      image_urls:      data.image_urls || [],
      external_id:     data.external_id || null,
      external_source: data.external_source || null,
      moderation_status: "pending_moderation",
    };

    const { data: insertedItem, error: insertError } = await supabase
      .from("bridge_items")
      .upsert(bridgeItemPayload, {
        onConflict: "tenant_id,external_source,external_id",
        ignoreDuplicates: false,
      })
      .select("id, name, item_type, moderation_status")
      .single();

    if (insertError) {
      console.error("Bridge receiver insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to store item", detail: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`✅ Bridge item received: [${tenant.tenant_slug}] ${insertedItem.name} (${insertedItem.id})`);

    // -------------------------------------------------------------------------
    // 5. Immediately generate vector embeddings for instant discoverability
    //    Combines name + description into the embedding text for richer search
    // -------------------------------------------------------------------------
    let embeddingGenerated = false;

    if (geminiApiKey) {
      const textToEmbed = [data.name, data.description].filter(Boolean).join(" ").trim();

      try {
        const embedResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "models/text-embedding-004",
              content: { parts: [{ text: textToEmbed }] },
            }),
          }
        );

        if (embedResponse.ok) {
          const embedResult = await embedResponse.json();
          const embedding = embedResult.embedding?.values;

          if (embedding && Array.isArray(embedding)) {
            const { error: embedUpdateError } = await supabase
              .from("bridge_items")
              .update({ embedding: `[${embedding.join(",")}]` })
              .eq("id", insertedItem.id);

            if (!embedUpdateError) {
              embeddingGenerated = true;
              console.log(`🧠 Embedding generated for bridge item ${insertedItem.id}`);
            }
          }
        }
      } catch (embedErr) {
        // Non-fatal — item is stored, embedding can be backfilled
        console.warn("Embedding generation failed (non-fatal):", embedErr);
      }
    }

    // -------------------------------------------------------------------------
    // 6. Return success — Guardian AI will process asynchronously via DB webhook
    // -------------------------------------------------------------------------
    return new Response(
      JSON.stringify({
        received:    true,
        item_id:     insertedItem.id,
        item_type:   insertedItem.item_type,
        status:      "pending_moderation",
        embedding:   embeddingGenerated ? "generated" : "pending",
        message:     "Item received and queued for moderation. It will be live once Guardian AI clears it.",
      }),
      {
        status: 202, // Accepted — not yet live
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (err) {
    console.error("360-bridge-receiver error:", err);
    return new Response(JSON.stringify({ error: "Bridge receiver error", detail: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
