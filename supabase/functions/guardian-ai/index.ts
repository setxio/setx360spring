// =============================================================================
// SETX 360 — Guardian AI (Extended: Phase 4 Bridge Item Moderation)
// Handles TWO payload types:
//   1. posts       — Social content (existing behavior)
//   2. bridge_items — Partner CSM inventory (new: Phase 4)
// =============================================================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    
    // Webhook payload from Supabase DB trigger or bridge receiver
    // Format: { type: 'INSERT', table: 'posts' | 'bridge_items', record: { ... } }
    const table = payload.table;

    if (table === 'bridge_items') {
      // -----------------------------------------------------------------------
      // PHASE 4: Partner CSM Inventory Moderation
      // -----------------------------------------------------------------------
      return await moderateBridgeItem(payload.record);
    }

    if (table !== 'posts') {
      return new Response("Ignored: Not a handled table", { headers: corsHeaders });
    }

    const postContent = payload.record?.content;
    const postId = payload.record?.id;
    const authorId = payload.record?.profile_id;

    if (!postContent) {
      return new Response("Ignored: No content to analyze", { headers: corsHeaders });
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY missing");
    }

    const prompt = `
      You are the SETX 360 AI Guardian. Your job is to moderate and categorize social media posts.
      Analyze the following text.
      
      1. Moderation: If it contains explicit NSFW content, intense profanity, harassment, or severe hate speech, flag it.
      2. Categorization: Detect if the post is primarily about a video, news, an event, a prayer request, or a sale. 
         Especially check for video links (YouTube, Vimeo, etc.).
      
      Post Text: "${postContent}"
      
      Return a strict JSON object:
      {
        "isViolation": boolean,
        "reason": "String explaining why it is a violation, or null if it is safe",
        "suggestedType": "post" | "video" | "news" | "event" | "prayer_request" | "sale",
        "confidence": float
      }
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    if (!response.ok) {
      throw new Error("Failed to call Gemini API");
    }

    const result = await response.json();
    const textResp = result.candidates?.[0]?.content?.parts?.[0]?.text;
    const aiResponse = JSON.parse(textResp);

    if (aiResponse.isViolation) {
      // Initialize Supabase admin client
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // 1. Insert a strike
      await supabaseAdmin.from('user_strikes').insert({
        user_id: authorId,
        post_id: postId,
        reason: `Automated AI Guardian Flag: ${aiResponse.reason}`
      });

      // 2. Hide the post
      await supabaseAdmin.from('posts')
        .update({ 
          moderation_status: 'hidden', 
          is_nsfw: true,
          ai_metadata: { 
            analysis: aiResponse, 
            analyzed_at: new Date().toISOString() 
          }
        })
        .eq('id', postId);
        
      console.log(`Action taken against post ${postId}: ${aiResponse.reason}`);
    } else if (aiResponse.suggestedType && aiResponse.suggestedType !== 'post' && aiResponse.confidence > 0.8) {
      // AI suggests a better category with high confidence
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Only update if it's currently just a generic 'post'
      await supabaseAdmin.rpc('categorize_post_ai', {
        post_id_val: postId,
        new_type: aiResponse.suggestedType,
        metadata: { 
          analysis: aiResponse, 
          analyzed_at: new Date().toISOString() 
        }
      });
    }

    return new Response(JSON.stringify({ status: 'analyzed', isViolation: aiResponse.isViolation }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Guardian AI Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

// =============================================================================
// Phase 4: Bridge Item Moderation Handler
// Analyzes Partner CSM inventory items for policy violations.
// Clears to 'live' or quarantines as 'flagged'.
// =============================================================================
async function moderateBridgeItem(record: any): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY missing');
  }

  const itemId   = record?.id;
  const tenantId = record?.tenant_id;
  const storeId  = record?.store_id;

  // Build analysis text from item name + description + metadata
  const itemText = [
    record?.name,
    record?.description,
    record?.metadata ? JSON.stringify(record.metadata).slice(0, 300) : ''
  ].filter(Boolean).join(' | ');

  if (!itemText) {
    // No text content — auto-approve
    await supabaseAdmin.from('bridge_items')
      .update({ moderation_status: 'live', ai_metadata: { auto_approved: true, reason: 'no_text_content' } })
      .eq('id', itemId);
    return new Response(JSON.stringify({ status: 'auto_approved', itemId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }

  const prompt = `
    You are the SETX 360 Marketplace Guardian. Your job is to review product listings, menu items, 
    and service descriptions submitted by Partner merchants.
    
    Analyze the following item text for policy violations:
    - Prohibited items (weapons, drugs, adult content, counterfeit goods)
    - Misleading or fraudulent claims
    - Hate speech or discriminatory language
    - Items that violate Southeast Texas local ordinances
    
    Item Text: "${itemText.replace(/"/g, "'")}"
    Item Type: "${record?.item_type || 'unknown'}"
    
    Return a strict JSON object:
    {
      "isViolation": boolean,
      "reason": "String explaining the violation, or null if compliant",
      "severity": "low" | "medium" | "high" | null,
      "confidence": float
    }
  `;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: 'application/json' }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const result     = await response.json();
  const textResp   = result.candidates?.[0]?.content?.parts?.[0]?.text;
  const aiResponse = JSON.parse(textResp);

  const aiMetadata = {
    analysis:    aiResponse,
    analyzed_at: new Date().toISOString(),
    model:       'gemini-2.0-flash',
  };

  if (aiResponse.isViolation) {
    // -------------------------------------------------------------------------
    // QUARANTINE: Flag the item and issue a strike against the merchant
    // -------------------------------------------------------------------------
    await supabaseAdmin.from('bridge_items').update({
      moderation_status: 'flagged',
      moderation_reason: aiResponse.reason,
      ai_metadata:       aiMetadata,
    }).eq('id', itemId);

    // Issue a strike against the store owner
    if (storeId) {
      const { data: store } = await supabaseAdmin
        .from('stores')
        .select('owner_id')
        .eq('id', storeId)
        .single();

      if (store?.owner_id) {
        await supabaseAdmin.from('user_strikes').insert({
          user_id: store.owner_id,
          post_id: null, // bridge items don't have post IDs
          reason:  `Marketplace Guardian: Prohibited item submitted by merchant. Item: "${record?.name}". Reason: ${aiResponse.reason}`,
        });
      }
    }

    console.log(`🚫 Bridge item FLAGGED [${tenantId}]: ${record?.name} — ${aiResponse.reason}`);

    return new Response(
      JSON.stringify({ status: 'flagged', itemId, reason: aiResponse.reason }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } else {
    // -------------------------------------------------------------------------
    // CLEARED: Set item to live — it is now discoverable in the marketplace
    // -------------------------------------------------------------------------
    await supabaseAdmin.from('bridge_items').update({
      moderation_status: 'live',
      ai_metadata:       aiMetadata,
    }).eq('id', itemId);

    console.log(`✅ Bridge item CLEARED [${tenantId}]: ${record?.name}`);

    return new Response(
      JSON.stringify({ status: 'live', itemId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
}
