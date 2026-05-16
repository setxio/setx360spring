# SETX 360 — RS256 Public Key
# Generated: 2026-05-10
# Purpose: JWT verification for SSO tokens issued by SETX 360
# 
# ⚠️ DISTRIBUTE THIS PUBLIC KEY TO EVERY PARTNER CSM (setx.io) INSTANCE
# Configure it as: SETX360_JWT_PUBLIC_KEY in each Partner CSM environment.
# The Partner CSM uses this key to verify inbound SSO JWTs signed by SETX 360.
#
# Private Key: Stored encrypted in Supabase Vault as RS256_PRIVATE_KEY
# Vault Secret ID: 45aa832e-d6b5-410a-a834-15938ce195ab
# Algorithm: RS256 (RSASSA-PKCS1-v1_5 + SHA-256), 2048-bit modulus

-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA5wcMuTE8hVNDgWVGEwXp
um2LpwWTjIFhU9MOkcvL3iUMwkc6EudBP/3dUKZjgp6cbU7+/a1qVKxsAZUm4/fR
+fu04ApOm2pb5/rrbEMSU5rKreh0bqwABfn4xefX2vsNAZNZ+Kdbc7MMQNKNzlEW
omk/GI491k1G0SZkg/qGzpz6nZBEUs2+XxX8qVbeOTHQb244rPczWPFwfeqibR6u
17fVE5nvm9hf3H6cGn/QDekjeuIsvLi4KoRVBfXJzeSxana8Q+Ba8hj8icHAiPn6
81k5+bLZpn0cAuUEk8u8gq5B2O17o2VQDd33U+IGqefAyljcMCC5DUOfdhMAWfcT
ywIDAQAB
-----END PUBLIC KEY-----

## Partner CSM Configuration

Add the following environment variable to EVERY setx.io / Partner CSM deployment:

SETX360_JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA5wcMuTE8hVNDgWVGEwXp
um2LpwWTjIFhU9MOkcvL3iUMwkc6EudBP/3dUKZjgp6cbU7+/a1qVKxsAZUm4/fR
+fu04ApOm2pb5/rrbEMSU5rKreh0bqwABfn4xefX2vsNAZNZ+Kdbc7MMQNKNzlEW
omk/GI491k1G0SZkg/qGzpz6nZBEUs2+XxX8qVbeOTHQb244rPczWPFwfeqibR6u
17fVE5nvm9hf3H6cGn/QDekjeuIsvLi4KoRVBfXJzeSxana8Q+Ba8hj8icHAiPn6
81k5+bLZpn0cAuUEk8u8gq5B2O17o2VQDd33U+IGqefAyljcMCC5DUOfdhMAWfcT
ywIDAQAB
-----END PUBLIC KEY-----"

## How to Verify a JWT (Partner CSM side — Node.js/Deno example)

```js
import { jwtVerify, importSPKI } from "npm:jose";

const PUBLIC_KEY_PEM = Deno.env.get("SETX360_JWT_PUBLIC_KEY");
const publicKey = await importSPKI(PUBLIC_KEY_PEM, "RS256");

const { payload } = await jwtVerify(inboundToken, publicKey, {
  issuer:   "setx360",
  audience: "your-tenant-slug",   // e.g. "beaumont-bbq"
});

// payload.sub = SETX 360 user UUID
// payload.email = user email
// payload.role = user role on SETX 360
```
