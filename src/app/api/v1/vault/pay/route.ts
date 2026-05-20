import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import * as xrpl from 'xrpl';

// Master XRPL Testnet endpoint
const XRPL_TESTNET_WSS = 'wss://s.altnet.rippletest.net:51233';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { amount, source_token, merchant_id, item_id } = body;

        if (!amount || amount <= 0 || !source_token || !merchant_id) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        // 1. Initialize Supabase client
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role since this handles system transactions
            {
                cookies: {
                    get(name: string) { return cookieStore.get(name)?.value; },
                },
            }
        );

        // 2. Validate SSO Token
        // Assuming the token is an auth token the merchant relayed from the user's session
        const { data: { user }, error: authError } = await supabase.auth.getUser(source_token);
        
        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid or expired session token' }, { status: 401 });
        }

        // 3. Get user's off-chain balance and destination tag
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('xrpl_destination_tag, setx_coin_balance')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: 'User profile or destination tag not found' }, { status: 404 });
        }

        if (profile.setx_coin_balance < amount) {
            return NextResponse.json({ error: 'Insufficient SETX Coin balance' }, { status: 400 });
        }

        // 4. Initialize XRPL Client
        const client = new xrpl.Client(XRPL_TESTNET_WSS);
        await client.connect();

        // Using County Operational Wallet 1 (Jefferson County) for demo
        // In production, fetch this securely from vault or env
        const walletSeed = process.env.XRPL_JEFFERSON_COUNTY_SEED || 'sEdSKmQjE1GnvG6E8F3c3L4gB2gVqG7'; // Example testnet seed format
        let wallet: xrpl.Wallet;
        try {
            wallet = xrpl.Wallet.fromSeed(walletSeed);
        } catch (e) {
             // Fallback to generating a random wallet on testnet if seed is invalid (for dev only)
             const fund_result = await client.fundWallet();
             wallet = fund_result.wallet;
        }

        // 5. Build and execute the XRPL transaction
        // This transaction moves 0.00001 XRP to cover gas, effectively registering the transaction on the ledger
        // The real SETX Coin value is off-chain and logged in Supabase.
        const tx: xrpl.Transaction = {
            TransactionType: "Payment",
            Account: wallet.address,
            Amount: "10", // 10 drops = 0.00001 XRP (standard minimum fee/transfer)
            Destination: wallet.address, // Sending to itself on testnet to log the tag
            DestinationTag: Number(profile.xrpl_destination_tag),
            Memos: [
                {
                    Memo: {
                        MemoData: Buffer.from(JSON.stringify({ 
                            action: 'purchase', 
                            merchant: merchant_id, 
                            amount_setx: amount,
                            item_id: item_id
                        })).toString('hex').toUpperCase()
                    }
                }
            ]
        };

        const prepared = await client.autofill(tx);
        const signed = wallet.sign(prepared);
        const result = await client.submitAndWait(signed.tx_blob);
        await client.disconnect();

        // Transaction successful on XRPL
        const txHash = result.result.hash;

        // 6. Update off-chain database logic
        // Decrement user balance
        const newBalance = profile.setx_coin_balance - amount;
        await supabase
            .from('profiles')
            .update({ setx_coin_balance: newBalance })
            .eq('id', user.id);

        // Record ledger transaction
        const { error: ledgerError } = await supabase
            .from('ledger_transactions')
            .insert({
                user_id: user.id,
                transaction_type: 'purchase',
                amount: amount,
                currency: 'SETX',
                xrpl_tx_hash: txHash,
                xrpl_wallet_source: 'jefferson_county_01',
                destination_tag: profile.xrpl_destination_tag,
                status: 'completed',
                metadata: { merchant_id, item_id }
            });

        if (ledgerError) {
            console.error('Failed to write ledger transaction:', ledgerError);
            // Ideally, handle rollback or dead-letter queue here
        }

        // 7. Return success to SETX.io
        return NextResponse.json({
            success: true,
            tx_hash: txHash,
            destination_tag: profile.xrpl_destination_tag,
            settled_amount: amount,
            remaining_balance: newBalance
        });

    } catch (err: any) {
        console.error('Vault Pay Error:', err);
        return NextResponse.json({ error: 'Internal Server Error', message: err.message }, { status: 500 });
    }
}
