# Certificate Detail View with VYC Lifecycle Status and Activity Events

> **Issue:** Certificate detail view with VYC lifecycle status and activity events  
> **Status:** ✅ Completed & Tested (Smart Contracts + Backend + Frontend)  
> **Target Branch:** `feat/certificate-detail-vyc-lifecycle-activity-events`

---

## 🎯 Acceptance Criteria Verification

- [x] **Certificate detail page reads the on-chain status via the contract read function**:
  - Implemented `/certificates/[id]` dynamic page using `getVyc(id)` to read `VycRecord` via Soroban RPC (`rpc.Server.simulateTransaction`).
  - Decodes `status`, `expected_yield`, `score`, `activity_hash`, `crop`, `region`, `created_at`, `updated_at`.
  - Supports live on-chain data and fallback simulation data with clear status indicators.
- [x] **Status transitions are shown clearly (Active → Redeemed / Expired / Cancelled)**:
  - Interactive `VycLifecycleTimeline` component depicting the 4 VYC lifecycle states.
  - Stage 1 (`Active` in production) to Stage 2 (`Redeemed`, `Expired`, or `Cancelled`).
  - Detailed investor and cooperative impact explanations for each lifecycle state.
- [x] **Activity events (season start, harvest, sale) are listed with dates**:
  - `VycActivityEvents` component displaying chronological underlying events: Season Registration, Sowing/Planting Log, Mid-Season Agronomy Inspection, Harvest QA Log, and Market Sale & USDC Settlement.
  - Includes dates, monetary amounts / yields, geographical regions, and attestor metadata.
  - SHA-256 Proof-of-Activity Hash verification bar with copy and verification status.
- [x] **Graceful error state when the certificate id does not exist**:
  - `CertificateNotFound` component handling non-existent or invalid certificate IDs.
  - Informative explanation and quick action buttons ("Back to Dashboard", "Mint New Certificate").
- [x] **Tests for the status mapping logic**:
  - Comprehensive Vitest unit tests in `app/__tests__/certificate-detail.test.ts` covering status mapping (numeric codes 0, 1, 2, 3, string aliases, fallbacks), lifecycle transition rules, ID validation, currency conversions, date formatting, and activity event derivation.

---

## 🧪 Build & Test Verification Evidence

All local check commands pass without errors or warnings:

### 1. Smart Contracts
- **Test Command:** `cd smartcontract && cargo test --all`
- **Output:** 15/15 tests passing (`smartcontract-test-output.txt`)
- **Release Build Command:** `cd smartcontract && cargo build --target wasm32-unknown-unknown --release`
- **Output:** Release wasm compiled successfully (`smartcontract-build-output.txt`)

### 2. Backend
- **Typecheck:** `cd backend && npm run typecheck`
- **Build:** `cd backend && npm run build`
- **Tests:** `cd backend && npm test`
- **Output:** 43/43 tests passing across 3 test files (`backend-test-output.txt`)

### 3. Frontend
- **Tests:** `cd frontend && npm test`
- **Output:** 42/42 tests passing across 6 test files (`frontend-test-output.txt`)
- **Production Build:** `cd frontend && npm run build`
- **Output:** Next.js Turbopack build succeeded with dynamic route `ƒ /certificates/[id]` (`frontend-build-output.txt`)

---

## 📁 Evidence Files

- `README.md` — Feature overview and criteria checklist
- `IMPLEMENTATION.md` — Detailed technical architecture and code references
- `smartcontract-test-output.txt` — Cargo test console log
- `smartcontract-build-output.txt` — Cargo release wasm build log
- `backend-test-output.txt` — Vitest backend test run console log
- `backend-build-output.txt` — TypeScript backend compile log
- `frontend-test-output.txt` — Vitest frontend test run console log
- `frontend-build-output.txt` — Next.js production build console log
