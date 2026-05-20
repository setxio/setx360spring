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

/**
 * SETX.io LLC Commercial B2B Standalone Storefront Checkout
 * REVENUE MODEL: 1% Payment Processing Convenience Fee.
 * 99% settles to the merchant's connected bank account, 1% routes to SETX.io LLC.
 */
export async function POST(req: Request) {
  try {
    const { items, tenant_slug, customer_email } = await req.json();

    if (!items || !items.length || !tenant_slug) {
      return NextResponse.json({ error: 'Invalid checkout payload' }, { status: 400 });
    }

    // 1. Lookup Merchant Tenant Profile to get Stripe Connect ID
    const { data: tenant } = await supabase
      .from('tenants')
      .select('stripe_connect_id, business_name')
      .eq('slug', tenant_slug)
      .eq('is_active', true)
      .single();

    if (!tenant || !tenant.stripe_connect_id) {
      return NextResponse.json({ error: 'Merchant Stripe Connect account not verified' }, { status: 404 });
    }

    // 2. Calculate Total Order Amount in Cents
    let totalCents = 0;
    const lineItems = items.map((item: any) => {
      const itemCents = Math.round(item.price * 100);
      totalCents += itemCents * item.quantity;
      return {
        price_data: {
          currency: 'usd',
          product_data: { name: item.name },
          unit_amount: itemCents,
        },
        quantity: item.quantity,
      };
    });

    // 3. Calculate 1% SETX.io LLC Software Convenience Fee
    const applicationFeeCents = Math.round(totalCents * 0.01);

    // 4. Create Stripe Connect Destination Charge Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: customer_email || undefined,
      line_items: lineItems,
      mode: 'payment',
      payment_intent_data: {
        application_fee_amount: applicationFeeCents, // 1% goes to SETX.io LLC
        transfer_data: {
          destination: tenant.stripe_connect_id, // 99% goes to Merchant Bank
        },
      },
      success_url: `http://${tenant_slug}.setx.io/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://${tenant_slug}.setx.io/checkout/cart`,
      metadata: {
        tenant_slug: tenant_slug,
        app_lane: 'setx-io-commercial-saas', // Explicit audit trail flag
        fee_extracted_cents: applicationFeeCents.toString()
      },
    });

    return NextResponse.json({ url: session.url }, { status: 200 });

  } catch (error: any) {
    console.error('SETX.io Commercial Checkout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
