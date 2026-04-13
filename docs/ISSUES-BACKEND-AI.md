# Backend & AI Roadmap 🧠⚙️

This document tracks the backend infrastructure and AI allocation engine for IntentRemit.

---

## 🏗️ Phase 1: Core Transfer Service

### Issue #BK-1: Stellar Payment Integration
**Category:** `[INTEGRATION]`
**Status:** ❌ PENDING
**Priority:** Critical
**Description:** Handle USDC/XLM transfers via Stellar network.
- **Tasks:**
  - [ ] Setup Node.js payment service.
  - [ ] Integrate Stellar SDK for transactions.
  - [ ] Handle payment to recipient address.
  - [ ] Implement transaction confirmation.

### Issue #BK-2: Transaction Tracking
**Category:** `[DATA]`
**Status:** ❌ PENDING
**Priority:** High
**Description:** Track all remittance transactions.
- **Tasks:**
  - [ ] Table: `transactions` (id, sender, recipient, amount, goal, timestamp).
  - [ ] Table: `vaults` (id, locked_amount, unlock_time, status).
  - [ ] Webhook for Horizon events (optional).

---

## 🧠 Phase 2: AI Allocation Engine

### Issue #BK-3: Rule-Based Suggestion Engine
**Category:** `[AI]`
**Status:** ❌ PENDING
**Priority:** Critical
**Description:** Generate allocation suggestions based on goal type.
- **Tasks:**
  - [ ] Define default splits per goal:
    - School Fees: 60% immediate, 40% locked
    - Rent: 70% immediate, 30% locked
    - Business Capital: 50% immediate, 50% locked
  - [ ] Factor in region heuristics.
  - [ ] API endpoint: `POST /suggest-allocation`

### Issue #BK-4: Context-Aware Suggestions
**Category:** `[AI]`
**Status:** ❌ PENDING
**Priority:** Medium
**Description:** Add contextual factors to suggestions.
- **Tasks:**
  - [ ] Consider recipient wallet history.
  - [ ] Factor in seasonal patterns (e.g., school terms).
  - [ ] Add custom goal support.

---

## 📡 Phase 3: API Layer

### Issue #BK-5: Transfer API
**Category:** `[API]`
**Status:** ❌ PENDING
**Priority:** High
**Description:** Serve transfer endpoints to frontend.
- **Tasks:**
  - [ ] Endpoint: `POST /transfer` (send with intent).
  - [ ] Endpoint: `GET /status/{transaction_id}`.
  - [ ] Endpoint: `GET /history/{wallet}`.

### Issue #BK-6: Vault API
**Category:** `[API]`
**Status:** ❌ PENDING
**Priority:** High
**Description:** Query vault status for recipients.
- **Tasks:**
  - [ ] Endpoint: `GET /vaults/{wallet}`.
  - [ ] Endpoint: `GET /vault/{vault_id}`.
  - [ ] Include unlock countdown in response.

---

## ⚡ Phase 4: Future Enhancements

### Issue #BK-7: Off-Ramp Integration (Future)
**Category:** `[INTEGRATION]`
**Status:** ❌ PENDING
**Priority:** Low
- **Tasks:**
  - [ ] Mobile money integration.
  - [ ] Bank transfer integration.

### Issue #BK-8: Advanced AI (Future)
**Category:** `[AI]`
**Status:** ❌ PENDING
**Priority:** Low
- **Tasks:**
  - [ ] Behavioral learning.
  - [ ] Personalized financial optimization.
  - [ ] Milestone tracking (receipt verification).