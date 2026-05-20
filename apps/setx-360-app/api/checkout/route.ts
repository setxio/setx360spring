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
 * SETX 360 DUNA Public Civic Protocol On-Ramp
 * STRICT COMPLIANCE RULE: 0% Platform Fees. 
 * Every transaction inside the community super-app is 100% free of personal profit.
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

    const { amount_setx } = await req.json();

    if (!amount_setx || isNaN(amount_setx) || amount_setx <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('dest_tag, email')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Exact 1:1 USD Peg. No markup. No application fee.
    const amountInCents = Math.round(amount_setx * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: profile.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'SETX Utility Token (Community On-Ramp)',
              description: '1:1 USD Pegged Digital Community Credit • 0% Platform Fees',
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/wallet?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/wallet?canceled=true`,
      metadata: {
        profile_id: user.id,
        destination_tag: profile.dest_tag?.toString() || '0',
        amount_setx: amount_setx.toString(),
        app_lane: 'setx-360-civic-protocol', // Explicit audit trail flag
        fee_extracted: '0.00'
      },
    });

    return NextResponse.json({ url: session.url }, { status: 200 });

  } catch (error: any) {
    console.error('SETX 360 Civic On-Ramp Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
