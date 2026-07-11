import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16' as any,
  });
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
  );
  
  const payload = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    if (!sig || !endpointSecret) throw new Error("Missing signature or secret");
    event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
  } catch (err: any) {
    console.error(`WB Webhook Error: ${err.message}`);
    // If testing locally without a valid webhook secret, you can bypass this in dev if needed,
    // but in prod this must throw.
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    const site_id = session.metadata?.site_id;
    const product_id = session.metadata?.product_id;
    const variation_id = session.metadata?.variation_id;

    if (site_id && product_id) {
      const customer_email = session.customer_details?.email || session.customer_email;
      const customer_name = session.customer_details?.name || 'Guest Checkout';
      const total_amount = session.amount_total ? session.amount_total / 100 : 0;
      
      // 1. Insert into wb_orders
      const { data: order, error: orderError } = await supabase
        .from('wb_orders')
        .insert({
          site_id,
          customer_email,
          customer_name,
          status: 'completed',
          payment_status: 'paid',
          total_amount,
          currency: session.currency || 'usd',
        })
        .select()
        .single();

      if (orderError || !order) {
        console.error('Failed to create order:', orderError);
        return NextResponse.json({ error: 'Order Creation Failed' }, { status: 500 });
      }

      // 2. Fetch product name to store in order_items
      const { data: product } = await supabase
        .from('wb_products')
        .select('title')
        .eq('id', product_id)
        .single();
        
      let productName = product?.title || 'Unknown Product';
      
      // Optionally fetch variation details to append to product name
      if (variation_id) {
        const { data: variation } = await supabase
          .from('wb_product_variations')
          .select('attributes')
          .eq('id', variation_id)
          .single();
        if (variation?.attributes) {
           productName += ` (${Object.values(variation.attributes).join(' / ')})`;
        }
      }

      // 3. Insert into wb_order_items
      await supabase
        .from('wb_order_items')
        .insert({
          order_id: order.id,
          product_id,
          product_name: productName,
          quantity: 1, // Assumes 1 quantity for now
          price_at_time: total_amount,
          subtotal: total_amount
        });
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
