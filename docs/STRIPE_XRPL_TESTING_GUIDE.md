# SETX 360 & SETX.io LLC • Stripe CLI & Live XRPL Testing Guide

This document provides the complete, step-by-step operational walkthrough to test the end-to-end fiat-to-crypto loop on your local development machine. By following these steps, you will verify that a simulated Stripe fiat deposit successfully mints elastically scaled `SETX` stablecoins on the live XRPL Testnet ledger.

---

## Prerequisites

1. **Stripe CLI**: Install the official Stripe CLI for Windows (`winget install stripe.cli` or download the binary).
2. **Node.js & TypeScript**: Ensure `ts-node` is available in your environment.
3. **XRPL Testnet Explorer**: Keep a browser tab open to [https://testnet.xrpl.org](https://testnet.xrpl.org).

---

## Step 1: Initialize the Live XRPL Master Treasury

Before testing webhooks, you must provision your live testnet wallets (Issuer & Operational Treasury) and establish the `SETX` trustline.

Run the automated initializer script from your terminal:
```powershell
npx ts-node scripts/init-xrpl-treasury.ts
```

### What Happens:
1. The script connects to `wss://s.altnet.rippletest.net:51233`.
2. It requests two funded wallets (~1,000 XRP each) from the official XRPL Faucet.
3. It configures the `lsfDefaultRipple` flag on the Issuer Wallet.
4. It establishes a 10-Billion `SETX` TrustSet between the Operational Treasury and the Issuer.
5. It outputs your exact `XRPL_TREASURY_SEED`, `XRPL_SETX_ISSUER`, and `XRPL_ISSUER_SEED` credentials.

**Action**: Ensure these generated credentials are saved inside your `.env.local` file.

---

## Step 2: Forward Stripe Webhooks to Localhost

To allow your local Next.js API route (`/api/webhooks/stripe`) to receive live Stripe events, start the Stripe CLI listener:

```powershell
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

### What Happens:
The CLI will output a webhook signing secret that looks like:
```text
> Ready! Your webhook signing secret is whsec_abcdef1234567890abcdef1234567890
```

**Action**: Copy this `whsec_...` value and paste it into `.env.local` as `STRIPE_WEBHOOK_SECRET`. Restart your Next.js development server (`npm run dev`).

---

## Step 3: Simulate a Fiat Deposit (Stripe Checkout)

With your local server running and the Stripe CLI listening, open a second terminal window and trigger a simulated successful checkout session:

```powershell
stripe trigger checkout.session.completed --add checkout_session:metadata.user_id="usr_test_123" --add checkout_session:metadata.amount_setx="150.00" --add checkout_session:metadata.app_lane="civic_nonprofit"
```

### What Happens:
1. Stripe generates a mock checkout event with the attached metadata.
2. The Stripe CLI intercepts the event and forwards it to `http://localhost:3000/api/webhooks/stripe`.

---

## Step 4: Verify Next.js Webhook & XRPL Minting Execution

Check the terminal running your Next.js development server (`npm run dev`). You will see the following automated execution logs:

```text
[STRIPE WEBHOOK] Received checkout.session.completed for User usr_test_123
[STRIPE WEBHOOK] Amount: 150.00 SETX | Lane: civic_nonprofit
[XRPL TOKEN MANAGER] Connecting to wss://s.altnet.rippletest.net:51233...
[XRPL TOKEN MANAGER] Minting 150.00 SETX from Issuer rIsSuEr... to Treasury rTReaSuRy...
[XRPL TOKEN MANAGER] Transaction Submitted! Hash: 0xABCD1234EF567890...
[SUPABASE LEDGER] Credited 150.00 SETX to User usr_test_123 wallet. Balance Updated.
```

---

## Step 5: Verify Live Ledger Settlement on XRPL Explorer

To prove mathematical ownership and verify that the transaction settled on the live decentralized ledger:

1. Copy the transaction hash (`0xABCD123...`) or your `XRPL_TREASURY_ADDRESS` from the terminal.
2. Paste it into the search bar at [https://testnet.xrpl.org](https://testnet.xrpl.org).

### Explorer Verification Checklist:
- [x] **Transaction Type**: `Payment`
- [x] **Amount**: `150.00 SETX`
- [x] **Issuer**: Matches your `XRPL_SETX_ISSUER` address.
- [x] **Destination**: Matches your `XRPL_TREASURY_ADDRESS`.
- [x] **Status**: `Success (tesSUCCESS)`

---

## Troubleshooting & Common Errors

| Error Message | Cause | Resolution |
| :--- | :--- | :--- |
| `tecPATH_DRY` / `tecPATH_PARTIAL` | Missing TrustSet or lsfDefaultRipple flag. | Re-run `scripts/init-xrpl-treasury.ts` to ensure trustlines are properly established. |
| `No webhook secret provided` | `STRIPE_WEBHOOK_SECRET` missing from `.env.local`. | Ensure you copied the `whsec_...` key from the `stripe listen` command. |
| `terQUEUED` | Network congestion or low fee. | The XRPL Token Manager will automatically retry or bump the base fee. |
