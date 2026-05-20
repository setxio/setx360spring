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
 * SETX.io LLC Commercial SaaS Subscription Endpoint
 * REVENUE MODEL: $49/month Standalone Storefront Hosting & Inventory Dashboard.
 * 100% of SaaS subscription revenue flows directly to the SETX.io LLC corporate account.
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized user' }, { status: 401 });
    }

    const { tenant_slug } = await req.json();

    if (!tenant_slug) {
      return NextResponse.json({ error: 'Missing tenant slug' }, { status: 400 });
    }

    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, business_name')
      .eq('slug', tenant_slug)
      .eq('owner_id', user.id)
      .single();

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant profile not found or unauthorized' }, { status: 404 });
    }

    // 1. Fetch user profile to get email
    const { data: profile } = await supabase.from('profiles').select('email').eq('id', user.id).single();

    // 2. Create Stripe Checkout Session for $49/month SaaS Subscription
    // Note: In production, price_12345 would be your pre-configured Stripe recurring price ID.
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: profile?.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'SETX.io Enterprise SaaS Subscription',
              description: 'Standalone Storefront Hosting on Vercel & Inventory Dashboard Management',
            },
            unit_amount: 4900, // $49.00 USD
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `http://${tenant_slug}.setx.io/admin/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://${tenant_slug}.setx.io/admin/billing?canceled=true`,
      metadata: {
        tenant_id: tenant.id,
        tenant_slug: tenant_slug,
        owner_id: user.id,
        app_lane: 'setx-io-commercial-saas', // Explicit audit trail flag
        revenue_type: 'monthly_subscription'
      },
    });

    return NextResponse.json({ url: session.url }, { status: 200 });

  } catch (error: any) {
    console.error('SETX.io SaaS Subscription Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
