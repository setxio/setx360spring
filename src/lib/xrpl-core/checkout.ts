import * as xrpl from 'xrpl';
import Stripe from 'stripe';

const XRPL_TESTNET_WSS = 'wss://s.altnet.rippletest.net:51233';

export async function executeMerchantSplitPay(
    buyerDestinationTag: number,
    vendorDestinationTag: number,
    totalAmountFiat: number,
    stripeConnectAccountId: string,
    cancelUrl: string,
    successUrl: string
) {
    if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('STRIPE_SECRET_KEY is not defined');
    }

    if (!process.env.XRPL_TREASURY_SEED) {
        throw new Error('XRPL_TREASURY_SEED is not defined');
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2026-04-22.dahlia',
        appInfo: { name: 'SETX 360 XRPL Bridge', version: '1.0.0' }
    });

    // 1. Calculate Fiat Split
    const totalAmountCents = Math.round(totalAmountFiat * 100);
    // Platform fee is 1%
    const applicationFeeAmount = Math.round(totalAmountCents * 0.01);

    // 2. Execute Fiat Split via Stripe Connect
    const sessionParams: any = {
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'SETX 360 Marketplace Purchase',
                        description: `Payment to Merchant (Tag: ${vendorDestinationTag})`
                    },
                    unit_amount: totalAmountCents,
                },
                quantity: 1,
            }
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        payment_intent_data: {
            application_fee_amount: applicationFeeAmount,
            // Pass the destination tags in Stripe metadata for auditing
            metadata: {
                buyer_tag: buyerDestinationTag.toString(),
                vendor_tag: vendorDestinationTag.toString()
            }
        },
    };

    let session;
    try {
        session = await stripe.checkout.sessions.create(sessionParams, {
            stripeAccount: stripeConnectAccountId,
        });
    } catch (err: any) {
        throw new Error(`Stripe Checkout Failed: ${err.message}`);
    }

    // 3. XRPL Testnet Automated Internal Ledger Transfer (10-drop fee)
    // We execute this asynchronously so it doesn't block the Stripe URL return
    // In production, you might await it or queue it in a background worker based on Webhook fulfillment
    recordXRPLSettlement(buyerDestinationTag, vendorDestinationTag).catch(err => {
         console.error('XRPL Settlement logging failed:', err);
         // Alerting should go here (e.g., Slack / Discord / DLQ)
    });

    return {
        stripeSessionUrl: session.url,
        stripeSessionId: session.id,
        fiatSplit: {
            totalAmountCents,
            applicationFeeAmount,
            merchantPayoutCents: totalAmountCents - applicationFeeAmount
        }
    };
}

/**
 * Connects to the XRPL Testnet using the master treasury seed and logs an immutable zero-value transaction.
 * It uses the SourceTag (buyer) and DestinationTag (vendor) to record the transaction.
 */
async function recordXRPLSettlement(buyerTag: number, vendorTag: number) {
    const client = new xrpl.Client(XRPL_TESTNET_WSS);
    await client.connect();

    try {
        const wallet = xrpl.Wallet.fromSeed(process.env.XRPL_TREASURY_SEED!);

        const tx: xrpl.Transaction = {
            TransactionType: "Payment",
            Account: wallet.address,
            Amount: "10", // 10 drops = minimum fee
            Destination: wallet.address, // Sending to itself for internal ledger mapping
            SourceTag: buyerTag,
            DestinationTag: vendorTag,
            Memos: [
                {
                    Memo: {
                        MemoData: Buffer.from("SETX 360 Settlement").toString('hex').toUpperCase()
                    }
                }
            ]
        };

        const prepared = await client.autofill(tx);
        const signed = wallet.sign(prepared);
        const result = await client.submitAndWait(signed.tx_blob);

        if (result.result.meta && typeof result.result.meta !== 'string') {
             if (result.result.meta.TransactionResult !== 'tesSUCCESS') {
                 throw new Error(`XRPL Transaction failed with: ${result.result.meta.TransactionResult}`);
             }
        }
        
        console.log(`XRPL Settlement Recorded! Hash: ${result.result.hash}`);
        return result.result.hash;
    } finally {
        await client.disconnect();
    }
}
