---
name: Due API rails and constraints
description: Verified rails, memo rules, and amount convention for Due sandbox payout (USDC → XOF mobile money).
---

## Confirmed working payout (sandbox)

- Source rail: `base-sepolia`, currency: `USDC` (blockchain rail → token is the currency)
- Destination rail: `xof_local`, currency: `XOF` (NOT `mobile_money` or `momo_africa` — those are recipient *schemas*, not rails)
- XAF equivalent: `xaf_local` / `XAF`

## Amount convention

Amount goes in **source** (USDC). The API converts and returns destination XOF amount in the quote response.

## Memo constraint

Memo must match `[a-zA-Z0-9 \-\./]+` — no em dashes, accents, or other special characters.
Use `"Test payout - 1000 XOF"` (hyphen), not `"Test payout — 1000 XOF"` (em dash).

**Why:** Due returns `err_memo_invalid_characters` 400 otherwise.

## Channel discovery

GET `/v1/channels` lists all available rails with their currency, type (deposit/withdrawal), and schemas.
GET `/v1/recipients/<id>` shows the recipient's schema (e.g. `momo_africa`) and `financialInstitutionId` — useful to confirm the right destination rail.

## Sandbox transfer lifecycle

After `sendPayout`, status is `awaiting_funds` — the sandbox waits for an on-chain USDC deposit to the `transferInstructions.treasury` address before settling.

## Rate observed (sandbox, 2026-06-07)

1 USDC ≈ 556 XOF (fxMarkup: 50 bps). Service fee: ~2% on XOF side.
