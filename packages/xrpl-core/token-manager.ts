import { Client, Wallet, Payment } from 'xrpl';

const XRPL_NODE_URL = process.env.NEXT_PUBLIC_MASTER_NODE_URL || 'wss://s.altnet.rippletest.net:51233';
const ISSUER_SEED = process.env.XRPL_ISSUER_SEED!;
const TREASURY_SEED = process.env.XRPL_TREASURY_SEED!;
const TREASURY_ADDRESS = process.env.XRPL_TREASURY_ADDRESS!;
const ISSUER_ADDRESS = process.env.XRPL_SETX_ISSUER!;
const CURRENCY_CODE = "5345545800000000000000000000000000000000"; // SETX encoded in 40-character hex format

/**
 * Mints an elastic supply of SETX stablecoin matching exact USD fiat deposits.
 * Sent from the Cold Treasury Issuer to the Operational Hot Treasury.
 */
export async function mintTokenSupply(amount_setx: number, targetDestTag: number) {
    if (amount_setx <= 0) throw new Error("Mint amount must be positive.");
    
    const client = new Client(XRPL_NODE_URL);
    await client.connect();
    
    const issuerWallet = Wallet.fromSeed(ISSUER_SEED);

    try {
        const tx: Payment = {
            TransactionType: "Payment",
            Account: issuerWallet.address,
            Destination: TREASURY_ADDRESS,
            DestinationTag: targetDestTag,
            Amount: {
                currency: CURRENCY_CODE,
                value: amount_setx.toString(),
                issuer: issuerWallet.address
            },
            Memos: [
                {
                    Memo: {
                        MemoType: Buffer.from("mint_setx", "utf8").toString("hex").toUpperCase(),
                        MemoData: Buffer.from(`MINT:${amount_setx} USD`, "utf8").toString("hex").toUpperCase()
                    }
                }
            ]
        };

        const prepared = await client.autofill(tx);
        const signed = issuerWallet.sign(prepared);
        const result = await client.submitAndWait(signed.tx_blob);

        return result;
    } finally {
        await client.disconnect();
    }
}

/**
 * Burns tokens from circulation when a merchant liquidates to USD fiat via ACH.
 * Sent from the Operational Hot Treasury back to the Cold Treasury Issuer.
 */
export async function burnTokenSupply(amount_setx: number, sourceDestTag: number) {
    if (amount_setx <= 0) throw new Error("Burn amount must be positive.");

    const client = new Client(XRPL_NODE_URL);
    await client.connect();

    const treasuryWallet = Wallet.fromSeed(TREASURY_SEED);

    try {
        const tx: Payment = {
            TransactionType: "Payment",
            Account: treasuryWallet.address,
            SourceTag: sourceDestTag,
            Destination: ISSUER_ADDRESS,
            Amount: {
                currency: CURRENCY_CODE,
                value: amount_setx.toString(),
                issuer: ISSUER_ADDRESS
            },
            Memos: [
                {
                    Memo: {
                        MemoType: Buffer.from("burn_setx", "utf8").toString("hex").toUpperCase(),
                        MemoData: Buffer.from(`BURN:${amount_setx} USD`, "utf8").toString("hex").toUpperCase()
                    }
                }
            ]
        };

        const prepared = await client.autofill(tx);
        const signed = treasuryWallet.sign(prepared);
        const result = await client.submitAndWait(signed.tx_blob);

        return result;
    } finally {
        await client.disconnect();
    }
}

