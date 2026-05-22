import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-token',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const adminToken = req.headers.get('x-admin-token')
    const expectedToken = Deno.env.get('ADMIN_BRIDGE_TOKEN')
    if (!adminToken || adminToken !== expectedToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized bridge access' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, data } = await req.json()

    switch (action) {

      // ─── AD ENGINE ─────────────────────────────────────────────────────────────
      case 'create_ad': {
        const { storeId, contentType, contentId, budget, durationDays } = data
        const endDate = new Date()
        endDate.setDate(endDate.getDate() + (durationDays || 7))

        const { data: ad, error } = await supabaseAdmin
          .from('platform_ads')
          .insert([{
            store_id: storeId,
            content_type: contentType,
            content_id: contentId,
            budget: budget,
            end_date: endDate.toISOString(),
            status: 'pending' // Super Admin must approve ads for now
          }])
          .select()
          .single()

        if (error) throw error
        return new Response(JSON.stringify(ad), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      case 'get_ads': {
        const { storeId, status } = data
        let query = supabaseAdmin.from('platform_ads').select('*, stores(name)')
        
        if (storeId) query = query.eq('store_id', storeId)
        if (status) query = query.eq('status', status)
        
        const { data: ads, error } = await query.order('created_at', { ascending: false })
        if (error) throw error
        return new Response(JSON.stringify(ads), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      case 'update_ad_status': {
        const { adId, status } = data
        const { error } = await supabaseAdmin.from('platform_ads').update({ status }).eq('id', adId)
        if (error) throw error
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // ─── BUSINESS PROVISIONING ──────────────────────────────────────────────
      case 'provision_business': {
        const { csmTenantId, businessName, industry, location, zipCode, logoUrl, description, ownerEmail, ownerName } = data
        const { data: store, error: storeError } = await supabaseAdmin.from('stores').insert([{
            name: businessName, type: 'csm_partner', category: industry, location: location || zipCode, zip: zipCode, city: location,
            description: description || `Official ${businessName} store — powered by SETX 360.`,
            bio: description || `Welcome to ${businessName}. Find us on the SETX 360 network.`,
            logo_url: logoUrl || null, status: 'active', is_verified: false, csm_tenant_id: csmTenantId,
            website_url: `https://${businessName.toLowerCase().replace(/\s+/g, '-')}.setx.io`
          }]).select().single()
        if (storeError) throw storeError
        const { data: profile } = await supabaseAdmin.from('profiles').insert([{ name: businessName, email: ownerEmail, role: 'merchant', city: location || 'Southeast Texas', bio: `${businessName} — ${industry}. Now on SETX 360.` }]).select().single()
        return new Response(JSON.stringify({ store_id: store.id, profile_id: profile?.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // ─── CATALOG SYNC ────────────────────────────────────────────────────────
      case 'sync_catalog': {
        const { storeId, products } = data
        const upsertData = products.map((p: any) => ({ store_id: storeId, name: p.name, description: p.description, price: p.price, image_url: p.image_url, category: p.category, external_id: p.id }))
        const { error } = await supabaseAdmin.from('products').upsert(upsertData, { onConflict: 'store_id,external_id' })
        if (error) throw error
        return new Response(JSON.stringify({ synced: upsertData.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // ─── DRIVER FLEET ────────────────────────────────────────────────────────
      case 'get_drivers': {
        const { data: drivers, error } = await supabaseAdmin.from('profiles').select('*').eq('role', 'driver').order('name')
        if (error) throw error
        return new Response(JSON.stringify(drivers), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // ─── USER & MERCHANT MANAGEMENT ──────────────────────────────────────────
      case 'get_users': {
        const { data: users, error } = await supabaseAdmin.from('profiles').select('*').limit(data?.limit || 100)
        if (error) throw error
        return new Response(JSON.stringify(users), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      case 'get_merchants': {
        const { data: merchants, error } = await supabaseAdmin.from('stores').select('*, profiles:owner_id(name, email)')
        if (error) throw error
        return new Response(JSON.stringify(merchants), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      case 'get_store_orders': {
        const { storeId } = data
        const { data: orders, error } = await supabaseAdmin.from('orders').select('*, profiles:user_id(name, email)').eq('store_id', storeId).order('created_at', { ascending: false })
        if (error) throw error
        return new Response(JSON.stringify(orders), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // ─── PLATFORM SETTINGS ────────────────────────────────────────────────────
      case 'get_platform_settings': {
        const { data: settings, error } = await supabaseAdmin.from('platform_settings').select('*').eq('id', 1).single()
        if (error) throw error
        return new Response(JSON.stringify(settings), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // ─── CROSS-NODE SSO VERIFICATION ─────────────────────────────────────────
      case 'verify_sso_token': {
        const { token } = data
        if (!token) {
          return new Response(JSON.stringify({ error: 'Token is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        
        try {
          const jwtSecret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
          
          // Native Web Crypto JWT verification
          const [headerB64, payloadB64, signatureB64] = token.split('.');
          if (!headerB64 || !payloadB64 || !signatureB64) {
            throw new Error('Invalid token structure');
          }

          const base64UrlDecode = (str: string) => {
            let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
            while (base64.length % 4) base64 += '=';
            return atob(base64);
          };

          const encoder = new TextEncoder();
          const keyData = encoder.encode(jwtSecret);
          const key = await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify']
          );

          const dataToVerify = encoder.encode(`${headerB64}.${payloadB64}`);
          
          const sigStr = base64UrlDecode(signatureB64);
          const sigBytes = new Uint8Array(sigStr.length);
          for (let i = 0; i < sigStr.length; i++) {
            sigBytes[i] = sigStr.charCodeAt(i);
          }

          const isValid = await crypto.subtle.verify(
            'HMAC',
            key,
            sigBytes,
            dataToVerify
          );

          if (!isValid) {
            return new Response(JSON.stringify({ error: 'Signature verification failed' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
          }

          const payload = JSON.parse(base64UrlDecode(payloadB64));
          
          // Verify expiration
          if (payload.exp && Date.now() / 1000 > payload.exp) {
            return new Response(JSON.stringify({ error: 'Token has expired' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
          }

          return new Response(JSON.stringify({ verified: true, payload }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        } catch (err) {
          return new Response(JSON.stringify({ error: 'Verification error', message: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
      }

      // ─── CROSS-NODE SETTINGS SYNC ────────────────────────────────────────────
      case 'sync_store_settings': {
        const { csmTenantId, name, category, description, isVacationMode, websiteUrl, logoUrl } = data
        if (!csmTenantId) {
          return new Response(JSON.stringify({ error: 'csmTenantId is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const updateFields: any = {}
        if (name !== undefined) updateFields.name = name
        if (category !== undefined) updateFields.category = category
        if (description !== undefined) {
          updateFields.description = description
          updateFields.bio = description
        }
        if (isVacationMode !== undefined) updateFields.is_vacation_mode = isVacationMode
        if (websiteUrl !== undefined) updateFields.website_url = websiteUrl
        if (logoUrl !== undefined) updateFields.logo_url = logoUrl

        const { data: updatedStore, error: updateError } = await supabaseAdmin
          .from('stores')
          .update(updateFields)
          .eq('csm_tenant_id', csmTenantId)
          .select()

        if (updateError) throw updateError
        return new Response(JSON.stringify({ success: true, updatedStore }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
