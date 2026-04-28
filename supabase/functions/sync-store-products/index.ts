import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { storeId } = await req.json()

    // 1. Fetch Store Integration Config
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single()

    if (storeError || !store) throw new Error('Store not found')
    if (store.integration_type === 'none') return new Response(JSON.stringify({ message: 'No integration configured' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const config = store.integration_config

    if (store.integration_type === 'shopify') {
      await syncShopifyProducts(supabase, store, config)
    } else if (store.integration_type === 'woocommerce') {
      await syncWooCommerceProducts(supabase, store, config)
    }

    // Update last sync time
    await supabase
      .from('stores')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', storeId)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function syncShopifyProducts(supabase: any, store: any, config: any) {
  const { shopify_domain, shopify_token } = config
  const url = `https://${shopify_domain}/admin/api/2023-01/products.json`

  const response = await fetch(url, {
    headers: {
      'X-Shopify-Access-Token': shopify_token,
      'Content-Type': 'application/json',
    }
  })

  const { products } = await response.json()

  for (const shopifyProduct of products) {
    // Map Shopify Product to SETX Product
    const productData = {
      store_id: store.id,
      name: shopifyProduct.title,
      description: shopifyProduct.body_html,
      price: shopifyProduct.variants[0]?.price || 0,
      image_urls: shopifyProduct.images.map((img: any) => img.src),
      stock_quantity: shopifyProduct.variants.reduce((acc: number, v: any) => acc + (v.inventory_quantity || 0), 0),
      external_id: shopifyProduct.id.toString(),
      external_source: 'shopify',
      status: shopifyProduct.status === 'active' ? 'active' : 'inactive'
    }

    // Upsert Product
    const { data: upsertedProduct, error: productError } = await supabase
      .from('products')
      .upsert(productData, { onConflict: 'external_id' })
      .select()
      .single()

    if (productError) continue

    // Sync Variants (Variables)
    if (shopifyProduct.variants.length > 1) {
      for (const variant of shopifyProduct.variants) {
        await supabase.from('product_variants').upsert({
          product_id: upsertedProduct.id,
          name: variant.title,
          sku: variant.sku,
          price: variant.price,
          stock_quantity: variant.inventory_quantity || 0,
          external_id: variant.id.toString()
        }, { onConflict: 'external_id' })
      }
    }
  }
}

async function syncWooCommerceProducts(supabase: any, store: any, config: any) {
  const { woo_url, woo_key, woo_secret } = config
  const url = `${woo_url}/wp-json/wc/v3/products`
  const auth = btoa(`${woo_key}:${woo_secret}`)

  const response = await fetch(url, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    }
  })

  const products = await response.json()

  for (const wooProduct of products) {
    const productData = {
      store_id: store.id,
      name: wooProduct.name,
      description: wooProduct.description,
      price: wooProduct.price || 0,
      image_urls: wooProduct.images.map((img: any) => img.src),
      stock_quantity: wooProduct.stock_quantity || 0,
      external_id: wooProduct.id.toString(),
      external_source: 'woocommerce',
      status: wooProduct.status === 'publish' ? 'active' : 'inactive'
    }

    const { data: upsertedProduct, error: productError } = await supabase
      .from('products')
      .upsert(productData, { onConflict: 'external_id' })
      .select()
      .single()

    if (productError) continue

    // Handle Variants for WooCommerce if applicable
    // (Requires additional call to /products/{id}/variations)
  }
}
