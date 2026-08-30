# Technical Implementation Summary: Certificate Detail View

## Overview
This implementation delivers a full-featured Certificate Detail View for AgriTrust Protocol's Verifiable Yield Certificates (VYCs). It allows investors, cooperatives, and smallholder farmers to inspect on-chain certificate parameters, follow state transitions through the VYC lifecycle state machine, and audit underlying agricultural activity events hash-locked to the Stellar ledger.

---

## Key Files & Architectural Components

### 1. Types & Helper Library (`frontend/app/lib/vyc.ts`)
- **`mapVycStatus(rawStatus)`**: Decodes Soroban enum variants (0: `Active`, 1: `Redeemed`, 2: `Expired`, 3: `Cancelled`) and string names with robust fallbacks.
- **`getLifecycleStageInfo(status)`**: Defines state machine rules, allowed next transitions, and investor/cooperative impact summaries.
- **`generateActivityEventsForVyc(vyc)`**: Creates the chronological Proof-of-Activity ledger (Season Start, Sowing/Planting, Mid-season Inspection, Harvest Log, Market Sale).
- **`formatMicroUsdc(microUsdc)`**: Converts 6-decimal micro-USDC to human-readable dollar amounts.
- **`isValidVycId(id)`** & **`isValidActivityHash(hash)`**: Validates positive integer IDs and 64-character SHA-256 digests.

### 2. Soroban Contract Reads (`frontend/app/services/soroban.ts`)
- **`getVyc(vycId)`**: Simulates transaction on `AgriTrust::get_vyc(id: u64)` against the Soroban RPC server, parsing `Option<VycRecord>` and mapping status enums.

### 3. Dynamic Page & UI Components
- **`frontend/app/certificates/[id]/page.tsx`**: Dynamic Next.js route receiving `params.id`.
- **`frontend/app/certificates/[id]/CertificateDetailClient.tsx`**: Main client orchestrator managing data fetch, loading spinners, breadcrumbs, metrics bar, and tabbed navigation.
- **`frontend/app/certificates/[id]/components/VycLifecycleTimeline.tsx`**: Visual stepper and branching transition matrix for `Active → Redeemed / Expired / Cancelled`.
- **`frontend/app/certificates/[id]/components/VycActivityEvents.tsx`**: Proof-of-Activity timeline with dates, quantities, attestors, and SHA-256 hash match tool.
- **`frontend/app/certificates/[id]/components/CertificateNotFound.tsx`**: Graceful 404 handler with recovery links.

### 4. Integration with Existing Views
- **`frontend/app/dashboard/page.tsx`**: Links each certificate in the dashboard table to `/certificates/${vyc.id}` with hover effects and chevron cues.
- **`frontend/app/admin/page.tsx`**: Links certificate rows in the admin console to `/certificates/${vyc.id}`.

### 5. Unit Test Suite (`frontend/app/__tests__/certificate-detail.test.ts`)
- 16 dedicated unit tests covering status decoding, lifecycle transition rules, ID validation, currency formatting, hash validation, and activity event generation.

---

## State Machine Transition Rules

```
                       ┌────────────────────────┐
                       │     VYC MINTED         │
                       │   (Score + Hash Locked)│
                       └───────────┬────────────┘
                                   │
                                   ▼
                       ┌────────────────────────┐
                       │      1. ACTIVE         │
                       │   (Financed / In Crop) │
                       └─────┬─────┬──────┬─────┘
                             │     │      │
            Certified Sale   │     │      │  Proof Discrepancy
            & Settlement     │     │      │  / Invalid Activity
       ┌─────────────────────┘     │      └────────────────────┐
       ▼                           ▼                           ▼
┌──────────────┐          ┌─────────────────┐         ┌─────────────────┐
│ 2. REDEEMED  │          │   2. EXPIRED    │         │  2. CANCELLED   │
│  (Settled)   │          │ (Window Closed) │         │    (Revoked)    │
└──────────────┘          └─────────────────┘         └─────────────────┘
```
