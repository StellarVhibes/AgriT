# AgriTrust — Backend

**VYC issuing, credit scoring, and on-chain relay for the AgriTrust Protocol on Stellar.**

Fastify + TypeScript service that bridges the `volatility_shield` Soroban contract and the Next.js frontend.

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933)](https://nodejs.org)
[![Stellar](https://img.shields.io/badge/Built%20on-Stellar-14B48E)](https://stellar.org)

---

## What it does

The backend is the off-chain half of the AgriTrust trust loop. The browser
cannot mint VYCs or update their status — the contract requires the protocol
admin keypair to auth those calls — so this service:

1. **Scores farmers** with a deterministic rule-based engine (0-100) over their
   verified proof-of-activity events, and produces the SHA-256 `activity_hash`
   stored on-chain. Never compute the score client-side.
2. **Relays admin writes**: holds `ADMIN_SECRET_KEY`, builds/signs/submits
   `mint_vyc` and `update_status` transactions via the Soroban RPC.
3. **Proxies reads** for the UI: `get_vyc`, `get_farmer_vycs`, `get_vyc_count`,
   plus an indexer over the contract's `vyc_minted` / `vyc_status` events so
   dashboards and insurance oracles get payout/harvest history.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/health` | Health check |
| POST   | `/score` | Compute 0-100 credit score + `activity_hash` + `expectedHarvestValue` from activities |
| GET    | `/vyc/:id?source=` | VYC record by id (on-chain read) |
| GET    | `/vyc/count?source=` | Total VYCs minted (on-chain read) |
| GET    | `/farmer/:account/vycs?source=` | VYC ids for a farmer (on-chain read) |
| GET    | `/vyc/events?startLedger=&cursor=&limit=` | Indexed `vyc_minted`/`vyc_status` events |
| POST   | `/admin/vyc/mint` | Mint a VYC (admin-only, on-chain write) |
| POST   | `/admin/vyc/:id/status` | Update VYC status (admin-only, on-chain write) |

All responses are JSON with `{ success: true, ... }` or `{ success: false, error }`.

## Setup

```bash
cd backend
npm install
cp .env.example .env   # set TESTNET_CONTRACT_ID and ADMIN_SECRET_KEY
npm run dev
```

The read endpoints work without any config if you pass `?source=` a funded
testnet `G...` account. `/admin/*` requires both env vars (or `?dryRun=true`
is ignored without them).

## Scripts

| Script | What |
|--------|------|
| `npm run dev` | hot-reload dev server (tsx watch) |
| `npm run build` | produce `dist/` |
| `npm run start` | run the built server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | vitest unit tests |

## Env

See `.env.example` for all variables and their meaning. The only strictly
required ones for on-chain writes are `TESTNET_CONTRACT_ID` / `MAINNET_CONTRACT_ID`
and `ADMIN_SECRET_KEY`. Set `ADMIN_API_TOKEN` to gate `/admin/*` behind an
`x-admin-token` header.

## Model notes

- Quantities are **micro-USDC** (6 decimals), matching `expected_yield: i128`.
- The `activity_hash` is a 64-char lowercase hex SHA-256, mirroring
  `VycRecord.activity_hash` in `smartcontract/contracts/volatility_shield`.
- The indexer translates Soroban events to JSON-safe records; `u64`/`i128`
  values are emitted as JS numbers (large values lose precision by design).