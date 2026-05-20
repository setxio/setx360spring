# SETX.io & SETX 360: Architectural White Paper & Logic Manual

## 1. Executive Summary & Core Philosophy
The SETX Ecosystem is a dual-entity digital architecture designed to scale seamlessly from a two-county pilot (Jefferson & Orange County, Texas) to a statewide platform (TX Orb). The system bifurcates commercial operations from civic infrastructure:

- **SETX.io LLC**: A for-profit, multi-tenant B2B SaaS platform providing independent, automated website generation, hosting, and merchant consulting for local businesses.
- **SETX 360 DUNA**: A Decentralized Unincorporated Nonprofit Association governed under Texas HB 4518. It acts as a public digital utility powering regional social media, marketplace protocols, municipal IoT tracking, and cryptographic voting rights.

### The Strict Legal & Revenue Boundary (Ethical Firewall)
To maintain the DUNA's nonprofit status and prevent any perception of a corporate monopoly, the codebase enforces a strict physical and financial separation between the public protocol and private commercial software:
- **SETX 360 Super-App (`apps/setx-360-app/`)**: 100% free of personal profit. 0% platform fees on retail purchases. Fraction-of-a-cent XRP gas fees are permanently subsidized by the DUNA's central gas tank (funded by treasury asset yield). Open competition is guaranteed.
- **SETX.io Standalone Sites (`apps/setx-io-saas/`)**: Private B2B SaaS code owned by SETX.io LLC. Generates revenue exclusively through traditional software consulting: $49/month Vercel hosting/inventory subscriptions, upfront custom development fees, and a standard 1% software convenience fee for processing standalone credit card checkouts via Stripe Connect.

**The foundational engineering rule of this ecosystem is absolute blockchain abstraction.** To achieve mass adoption in slower-moving markets, all cryptographic elements (wallets, seed phrases, gas management, sidechain bridges) are executed strictly on the server side. End-users experience a standard, modern Web2 interface.

## 2. Global Entity & Domain Routing Logic
The system utilizes a split-routing model managed via Vercel Edge Middleware. It must parse the incoming request domain and dynamically swap the underlying data tenant without altering the user's browser URL bar.

```
                       ┌───► if hostname == 'setx360.org' ────► Render Super-App Core
                       │
[Incoming Request] ────┼───► if subdomain == '*.setx.io' ───► Render Tenant Template
                       │
                       └───► if hostname == 'custom.com' ────► Map & Render Tenant Site
```

### Routing Matrix
- **The Super-App Engine (`setx360.org`)**: Resolves directly to the main portal handling centralized user profiles, the community social feed, local delivery dispatcher tools, and civic voting panels.
- **The B2B Platform (`setx.io`)**: Resolves to the marketing, billing, and layout configuration dashboard where merchants manage their independent storefronts.
- **Multi-Tenant Subdomains (`[tenant-slug].setx.io`)**: Intercepted at the Edge. The middleware extracts the slug, references the Supabase tenants table, and serves the corresponding merchant storefront dynamically.
- **White-Labeled Custom Domains (`merchantcustomdomain.com`)**: Mapped via Vercel Domains API. The middleware matches the raw domain string against the database, serving the tenant's products seamlessly while maintaining independent branding.

## 3. Decentralized Identity (DID) & Unified Authentication
SETX 360 functions as the master identity provider (IdP) for the entire ecosystem. Users do not manage private keys; instead, their authentication is mapped to a cryptographic keypair behind a standard OAuth 2.0 / JWT interface.

### The Handshake Sequence
1. **Onboarding**: A user registers on SETX 360 using an email or phone number. A secure, non-custodial wallet instance is automatically provisioned via an embedded KMS (Key Management Service) or Account Abstraction SDK.
2. **Destination Tag Generation**: To bypass the 1 XRP base wallet activation reserve per account on the XRP Ledger (XRPL), the system assigns the user a sequential bigint Destination Tag tied to the master DUNA Treasury Wallet.
3. **Cross-Platform SSO**: When a citizen visits an independent merchant site built on SETX.io and clicks "Login with SETX 360", an OAuth 2.0 PKCE flow is initiated. Upon user confirmation, SETX 360 signs a JWT containing the user's `profile_id`, email, and `destination_tag`, handing it back to the merchant site's session storage.

## 4. Dual-Layer Tokenomics & Financial Routing Logic
The ecosystem utilizes a custom token (SETX Coin) pegged strictly to the US Dollar ($1 SETX = $1 USD) to eliminate merchant volatility. The backend splits gas management from settlement asset tracking across two layers of the XRP Ledger ecosystem.

```text
               ┌────────────────────────────────────────────────────────┐
               │              SETX 360 DUNA MASTER TREASURY             │
               └───────────────────────────┬────────────────────────────┘
                                           │
                  ┌────────────────────────┴────────────────────────┐
                  ▼                                                 ▼
       [ XRPL MAINNET LAYER ]                            [ XRPL EVM SIDECHAIN ]
  (High-Speed Fiat-Pegged Settlement)              (Solidity Logic & Governance)
  • 3-Second Marketplace Settlements               • Zero-Knowledge Civic Voting
  • P2P Token Transfers                            • Municipal IoT Data Hashing
  • Destination Tag Balance Isolation             • DUNA Protocol Adjustments
```

### Layer A: XRPL Mainnet (Settlement & Commerce)
- **Role**: Handles ultra-low-cost, high-throughput retail transactions.
- **Mechanism**: Operates via Issued Currencies on the XRPL Mainnet. Transactions utilize the master Treasury Seed to submit payments from SourceTag (Buyer) to DestinationTag (Merchant) inside the native XRPL transaction object.
- **Cost Efficiency**: Each settlement burns exactly 10 drops ($0.00001 XRP). A baseline 20 XRP pool guarantees approximately 1.9 million production transactions before refueling is necessary.

### Layer B: XRPL EVM Sidechain (Complex Programmatic Logic)
- **Role**: Handles Turing-complete smart contracts (Solidity) that the base ledger cannot natively compute.
- **Mechanism**: Executes civic voting protocols, decentralized compliance, and heavy automation logs. It bridges to the Mainnet via native sidechain cross-chain mechanics, utilizing XRP as the gas mechanism on both sides.

### The Fiat-to-Token On-Ramp Pipeline
```text
[User App Interface] ──(Selects $50 Purchase)──► [Stripe Checkout API]
                                                         │
                                               (Captures Fiat Funds)
                                                         │
                                                         ▼
[Supabase DB / Ledger] ◄──(Increments Tag +50)── [Vercel Webhook Listener]
```
1. User enters debit card criteria to load 50 tokens inside the super-app.
2. Stripe processes the fiat currency, deposit-routing the USD into the DUNA-controlled corporate vault.
3. Stripe emits a secure webhook event (`checkout.session.completed`) to Vercel.
4. The Vercel Edge script validates the webhook signature, increments the `balance_setx` matching the user's row in Supabase, and logs the on-chain confirmation via the master Treasury wallet with the user's sequential destination tag.

### The Merchant Split-Payment Engine
When an e-commerce purchase occurs on an independent SETX.io site, the transaction routes through Stripe Connect to seamlessly partition cash flows:
1. **99% Gross Settlement**: Routed instantly to the merchant’s connected local bank account.
2. **1% Protocol Split Fee**: Retained by the platform. A fraction of this split automatically interacts with an institutional liquidity API to buy spot XRP, systematically refueling the county's operational gas wallets (`operational_wallet_jefferson`, `operational_wallet_orange`).

## 5. Ecosystem Layering (Modular Upgrades)
To maintain a highly agile initial launch, advanced external integrations are modeled as modular plug-ins that snap onto the core architecture once traction is established:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        CORE PLATFORM FOUNDATION                        │
│             (Next.js App Router + Supabase + XRPL Testnet)             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
[ PREPARATION LAYER ]     [ LOGISTICS UPGRADE ]       [ TREASURY UPGRADE ]
   Flare Network             Zebec Protocol               Ondo Finance
(Secure IoT Telemetry     (Continuous Per-Second      (Tokenized US Treasury
    to EVM Sidechain)       Streaming Payroll)          Yield Generation)
```

- **Flare Network Integration (Smart Cities)**: Used to resolve oracle problems for city-infrastructure telemetry. When municipal meters or physical smart devices log network usage, Flare's State Connector verifies the data state off-chain and safely delivers it to the XRPL EVM Sidechain voting and utility contracts without risking single-point manipulation.
- **Zebec Protocol Integration (Real-Time Payroll)**: Upgrades the local marketplace delivery network. Instead of processing delayed gig-economy payouts, Zebec's multi-token streaming contracts allow delivery drivers to receive custom tokens continuously by the second while active on a shift.
- **Ondo Finance Integration (Capital Efficiency)**: Minimizes asset stagnation. As the DUNA's fiat reserves grow inside the centralized bank, the treasury code programmatically converts stagnant USD reserves into tokenized real-world assets (such as Ondo's USDY or OUSG). This earns a consistent 4% to 5% low-risk yield, providing the DUNA network with an autonomous funding mechanism to permanently sponsor municipal gas fees.

## 6. Unified Database Architecture (Supabase Engine)
The system enforces relational integrity across multi-tenant clients while scaling horizontally using partitioned tables grouped by county or state jurisdiction.

```sql
-- ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- SYSTEM ENUMS
CREATE TYPE texas_county AS ENUM ('Jefferson', 'Orange');
CREATE TYPE tx_status AS ENUM ('pending', 'completed', 'failed');
CREATE TYPE tx_type AS ENUM ('p2p', 'merchant_checkout', 'gas_refuel', 'civic_subsidy');

-- 1. CENTRAL PROFILES TABLE (Shared Auth Identity)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    home_county texas_county NOT NULL,
    dest_tag BIGINT GENERATED ALWAYS AS IDENTITY (START WITH 100000 INCREMENT BY 1) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. WALLET BALANCES TABLE (Off-Chain Token Shadow Ledger)
CREATE TABLE wallet_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    balance_setx NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT positive_balance CHECK (balance_setx >= 0.00)
);

-- 3. SAAS TENANTS TABLE (SETX.io Business Entities)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES profiles(id) ON DELETE RESTRICT NOT NULL,
    business_name TEXT NOT NULL,
    stripe_connect_id TEXT UNIQUE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. CUSTOM DOMAINS TABLE (Edge Routing Mapping)
CREATE TABLE custom_domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    domain_name TEXT UNIQUE NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. LEDGER TRANSACTIONS TABLE
CREATE TABLE ledger_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_tag BIGINT REFERENCES profiles(dest_tag),
    receiver_tag BIGINT REFERENCES profiles(dest_tag),
    amount_setx NUMERIC(12, 2) NOT NULL,
    tx_hash TEXT UNIQUE,
    status tx_status DEFAULT 'pending'::tx_status NOT NULL,
    transaction_type tx_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- AUTOMATED DB TRIGGER FOR NEW SIGNUPS
CREATE OR REPLACE FUNCTION handle_new_user_setup()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.wallet_balances (profile_id, balance_setx)
    VALUES (NEW.id, 0.00);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON profiles
    FOR EACH ROW EXECUTE FUNCTION handle_new_user_setup();

-- OPTIMIZATION INDEXES FOR STATE-LEVEL HORIZONTAL SCALING
CREATE INDEX idx_profiles_county ON profiles(home_county);
CREATE INDEX idx_domains_lookup ON custom_domains(domain_name);
CREATE INDEX idx_tx_sender ON ledger_transactions(sender_tag);
CREATE INDEX idx_tx_receiver ON ledger_transactions(receiver_tag);
```

## 7. Operational Prompts for Antigravity Workspace Interaction
When communicating with the IDE to write individual components of this application stack, use the following operational hooks:
- "Referencing Section 2 and 6 of the White Paper, build out the Next.js API catch-all page router under `apps/setx-io-saas/app/[...site]/page.tsx` to read the rewritten host data from the middleware and render the target tenant's specific database profile."
- "Referencing Section 4 of the White Paper, draft the core backend listener file `packages/xrpl-core/mint.ts` to sign token asset balances across the XRPL Testnet using the shared destination tag database constraints."
