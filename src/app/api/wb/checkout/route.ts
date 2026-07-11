import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { site_id, product_id, variation_id, success_url, cancel_url } = body;

    if (!site_id || !product_id || !success_url || !cancel_url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Verify Site and Get Owner
    const { data: site } = await supabase
      .from('wb_sites')
      .select('id, name, owner_id')
      .eq('id', site_id)
      .single();

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // 2. Look up Stripe Connect ID from Tenant
    const { data: tenantRole } = await supabase
      .from('user_roles')
      .select('tenant_id')
      .eq('user_id', site.owner_id)
      .limit(1)
      .single();

    let stripeConnectId = null;
    if (tenantRole?.tenant_id) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('stripe_connect_id')
        .eq('id', tenantRole.tenant_id)
        .single();
      stripeConnectId = tenant?.stripe_connect_id;
    }

    // 3. Look up Product
    const { data: product } = await supabase
      .from('wb_products')
      .select('*')
      .eq('id', product_id)
      .eq('site_id', site_id)
      .single();

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    let price = Number(product.price);
    let title = product.title;

    // 4. Handle Variation if provided
    if (variation_id) {
      const { data: variation } = await supabase
        .from('wb_product_variations')
        .select('*')
        .eq('id', variation_id)
        .eq('product_id', product_id)
        .single();

      if (variation) {
        if (variation.price !== null && variation.price !== undefined) {
          price = Number(variation.price);
        }
        title = `${product.title} (${Object.values(variation.attributes || {}).join(' / ')})`;
      }
    }

    const priceInCents = Math.round(price * 100);

    // 5. Build Checkout Session Payload
    const sessionPayload: any = {
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: title,
              description: `Purchased from ${site.name}`,
              images: product.image_url ? [product.image_url] : [],
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url,
      cancel_url,
      metadata: {
        site_id,
        product_id,
        variation_id: variation_id || null,
      },
    };

    // 6. Route funds if connected account exists
    if (stripeConnectId) {
      // Platform takes 5% fee (minimum $0.50)
      const applicationFeeAmount = Math.max(50, Math.round(priceInCents * 0.05));
      sessionPayload.payment_intent_data = {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: stripeConnectId,
        },
      };
    }

    // 7. Create Session
    const session = await stripe.checkout.sessions.create(sessionPayload);

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe Checkout Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
