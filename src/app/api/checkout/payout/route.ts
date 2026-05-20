import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';



export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
  });
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
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

    const { amount_setx, stripe_account_id } = await req.json();

    if (!amount_setx || isNaN(amount_setx) || amount_setx <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (!stripe_account_id) {
      return NextResponse.json({ error: 'Missing Stripe Connect Account ID' }, { status: 400 });
    }

    // 1. Verify merchant balance
    const { data: wallet } = await supabase
      .from('wallet_balances')
      .select('balance_setx')
      .eq('profile_id', user.id)
      .single();

    if (!wallet || wallet.balance_setx < amount_setx) {
      return NextResponse.json({ error: 'Insufficient SETX balance' }, { status: 400 });
    }

    // 2. Deduct (Burn) the balance off-chain
    const newBalance = wallet.balance_setx - amount_setx;
    const { error: updateError } = await supabase
      .from('wallet_balances')
      .update({ balance_setx: newBalance })
      .eq('profile_id', user.id);

    if (updateError) throw updateError;

    // 3. Initiate Stripe Connect Transfer (ACH Payout)
    // 1 SETX = $1 USD. Stripe expects cents.
    const amountInCents = Math.round(amount_setx * 100);
    
    const transfer = await stripe.transfers.create({
      amount: amountInCents,
      currency: 'usd',
      destination: stripe_account_id,
      description: `SETX Token Cash-Out: ${amount_setx} SETX Burned`,
    });

    // 4. Log the burn transaction
    const { data: profile } = await supabase.from('profiles').select('dest_tag').eq('id', user.id).single();

    await supabase.from('ledger_transactions').insert({
      sender_tag: profile?.dest_tag || null,
      receiver_tag: 0, // Treasury
      amount_setx: amount_setx,
      transaction_type: 'merchant_checkout', // or cash_out
      status: 'completed',
      tx_hash: transfer.id
    });

    return NextResponse.json({ success: true, transfer_id: transfer.id }, { status: 200 });

  } catch (error: any) {
    console.error('Merchant Payout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
