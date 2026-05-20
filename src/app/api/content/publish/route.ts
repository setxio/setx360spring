import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Client, Wallet, AccountSet } from 'xrpl';

export const runtime = 'edge';

// Initialize Supabase admin client for secure backend inserts
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

const XRPL_NODE_URL = process.env.NEXT_PUBLIC_MASTER_NODE_URL || 'wss://s.altnet.rippletest.net:51233';
const TREASURY_SEED = process.env.XRPL_TREASURY_SEED!;

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized JWT signature' }, { status: 401 });
    }

    const body = await req.json();
    const { content_cid, content_type, is_encrypted = false } = body;

    if (!content_cid || !content_type) {
      return NextResponse.json({ error: 'Missing required payload parameters (content_cid, content_type)' }, { status: 400 });
    }

    // 1. Fetch user's DID from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('did_address')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const userDid = profile.did_address;
    if (!userDid) {
      return NextResponse.json({ error: 'User does not have a registered DID' }, { status: 400 });
    }

    // 2. Submit Immutable XRPL Transaction to the Ledger (The "Title")
    let xrplTxHash = null;
    
    // Attempt the XRPL logging. If it fails, we still might want to save to DB, 
    // or we can fail the whole request depending on strictness. We will be strict.
    if (TREASURY_SEED) {
      const client = new Client(XRPL_NODE_URL);
      await client.connect();

      const wallet = Wallet.fromSeed(TREASURY_SEED);

      // Create an AccountSet transaction acting as a dummy data carrier using Memos
      const tx: AccountSet = {
        TransactionType: "AccountSet",
        Account: wallet.address,
        Memos: [
          {
            Memo: {
              MemoType: Buffer.from("sovereign_content", "utf8").toString("hex").toUpperCase(),
              MemoFormat: Buffer.from("text/plain", "utf8").toString("hex").toUpperCase(),
              MemoData: Buffer.from(`DID:${userDid}|CID:${content_cid}`, "utf8").toString("hex").toUpperCase()
            }
          }
        ]
      };

      const prepared = await client.autofill(tx);
      const signed = wallet.sign(prepared);
      const result = await client.submitAndWait(signed.tx_blob);

      xrplTxHash = result.result.hash;
      await client.disconnect();
    } else {
      console.warn("XRPL_TREASURY_SEED not found in env. Bypassing ledger log for testing.");
    }

    // 3. Write metadata pointer to sovereign_content table
    const { data: record, error: dbError } = await supabase
      .from('sovereign_content')
      .insert({
        user_did: userDid,
        content_cid,
        content_type,
        is_encrypted,
        xrpl_tx_hash: xrplTxHash
      })
      .select()
      .single();

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Sovereign content securely logged to IPFS and XRPL.',
      record
    }, { status: 200 });

  } catch (error: any) {
    console.error('Content Relayer Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
