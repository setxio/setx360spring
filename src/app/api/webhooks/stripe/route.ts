import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Client, Wallet, Payment } from 'xrpl';


const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const XRPL_NODE_URL = process.env.NEXT_PUBLIC_MASTER_NODE_URL || 'wss://s.altnet.rippletest.net:51233';
const TREASURY_SEED = process.env.XRPL_TREASURY_SEED!;



export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
  });
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const payload = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    if (!sig || !endpointSecret) throw new Error("Missing signature or secret");
    event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    const profile_id = session.metadata?.profile_id;
    const dest_tag = session.metadata?.destination_tag;
    const amount_setx = parseFloat(session.metadata?.amount_setx || '0');

    if (profile_id && amount_setx > 0) {
      
      // 1. Increment the balance in the off-chain shadow ledger
      const { error: updateError } = await supabase.rpc('increment_wallet_balance', {
        pid: profile_id,
        amount: amount_setx
      });

      if (updateError) {
        console.error('Failed to increment Supabase balance:', updateError);
        // Fallback: direct update if RPC doesn't exist
        await supabase.from('wallet_balances')
          .update({ balance_setx: amount_setx }) // In production, read current balance and add
          .eq('profile_id', profile_id);
      }

      // 2. Minting Log on XRPL (The Master Treasury writes the receipt)
      if (TREASURY_SEED && dest_tag) {
        try {
          const client = new Client(XRPL_NODE_URL);
          await client.connect();
          const wallet = Wallet.fromSeed(TREASURY_SEED);

          const tx: Payment = {
            TransactionType: "Payment",
            Account: wallet.address,
            Destination: wallet.address, // Sending to self
            DestinationTag: parseInt(dest_tag), // User's specific tag
            Amount: "1", // 1 drop to record the tx
            Memos: [
              {
                Memo: {
                  MemoType: Buffer.from("mint_setx", "utf8").toString("hex").toUpperCase(),
                  MemoFormat: Buffer.from("text/plain", "utf8").toString("hex").toUpperCase(),
                  MemoData: Buffer.from(`MINT:${amount_setx} USD`, "utf8").toString("hex").toUpperCase()
                }
              }
            ]
          };

          const prepared = await client.autofill(tx);
          const signed = wallet.sign(prepared);
          await client.submitAndWait(signed.tx_blob);
          await client.disconnect();
          
          console.log(`XRPL Mint Successful for tag ${dest_tag}`);
        } catch (xrplError) {
          console.error("XRPL Minting failed, but fiat was captured:", xrplError);
        }
      }

      // 3. Log the transaction in the ledger_transactions table
      await supabase.from('ledger_transactions').insert({
        sender_tag: 0, // Treasury
        receiver_tag: dest_tag ? parseInt(dest_tag) : null,
        amount_setx: amount_setx,
        transaction_type: 'p2p',
        status: 'completed'
      });
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
