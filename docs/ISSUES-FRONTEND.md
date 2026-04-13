# Frontend Issues - IntentRemit 🎨

This document tracks the detailed UI/UX and integration tasks for the IntentRemit dashboard.

---

## 🚀 Phase 1: Foundation

### Issue #FE-1: Project Scaffold & Theme
**Category:** `[UI]`
**Status:** ❌ PENDING
**Priority:** Critical
**Description:** Initialize Next.js app with IntentRemit branding.
- **Tasks:**
  - [ ] Configure `tailwind.config.ts` (Warm, trustworthy theme).
  - [ ] Setup `globals.css` colors (Green/gold accents for growth).
  - [ ] Implement `Layout` with header and navigation.

### Issue #FE-2: Freighter Wallet Integration
**Category:** `[INTEGRATION]`
**Status:** ❌ PENDING
**Priority:** Critical
**Description:** Global wallet state management.
- **Tasks:**
  - [ ] Create `FreighterContext`.
  - [ ] Implement connection logic.
  - [ ] Auto-reconnect on refresh.
  - [ ] Display connected wallet address.

---

## 💸 Phase 2: Send Flow

### Issue #FE-3: Recipient Input
**Category:** `[UI]`
**Status:** ❌ PENDING
**Priority:** High
**Description:** Enter recipient Stellar address.
- **Tasks:**
  - [ ] Input field for recipient address.
  - [ ] Address validation (Stellar format).
  - [ ] Optional: Address book / recent recipients.

### Issue #FE-4: Goal Selection
**Category:** `[UI]`
**Status:** ❌ PENDING
**Priority:** High
**Description:** Select the purpose of the remittance.
- **Tasks:**
  - [ ] Goal selector: School Fees, Rent, Business Capital, Custom.
  - [ ] Display icon/image for each goal.
  - [ ] Optional note/message field.

### Issue #FE-5: Amount Input
**Category:** `[UI]`
**Status:** ❌ PENDING
**Priority:** High
**Description:** Enter transfer amount.
- **Tasks:**
  - [ ] Amount input (USDC or XLM).
  - [ ] Currency toggle.
  - [ ] Display equivalent in both assets.
  - [ ] Show estimated fees.

### Issue #FE-6: AI Allocation Suggestion
**Category:** `[UI/INTEGRATION]`
**Status:** ❌ PENDING
**Priority:** High
**Description:** Display AI-suggested split.
- **Tasks:**
  - [ ] Call suggestion API based on goal type.
  - [ ] Display suggestion: "55% now, 45% locked"
  - [ ] Accept/Modify buttons.
  - [ ] Custom split input option.

---

## 🔐 Phase 3: Vault Configuration

### Issue #FE-7: Conditional Split Setup
**Category:** `[UI]`
**Status:** ❌ PENDING
**Priority:** High
**Description:** Configure immediate vs locked amounts.
- **Tasks:**
  - [ ] Slider or input for split percentage.
  - [ ] Real-time calculation of amounts.
  - [ ] Display: "X available now, Y locked"

### Issue #FE-8: Lock Duration
**Category:** `[UI]`
**Status:** ❌ PENDING
**Priority:** High
- **Tasks:**
  - [ ] Date picker for unlock time.
  - [ ] Preset options (1 week, 1 month, 3 months, custom).
  - [ ] Display countdown visualization.

### Issue #FE-9: Transaction Review
**Category:** `[UI]`
**Status:** ❌ PENDING
**Priority:** High
- **Tasks:**
  - [ ] Summary of all settings.
  - [ ] "Send" button with confirmation.
  - [ ] Transaction toast notifications.

---

## 📊 Phase 4: Recipient Dashboard

### Issue #FE-10: Available Balance
**Category:** `[UI]`
**Status:** ❌ PENDING
**Priority:** High
- **Tasks:**
  - [ ] Display immediately available funds.
  - [ ] "Withdraw" button (simulated for MVP).

### Issue #FE-11: Growth Vault Display
**Category:** `[UI]`
**Status:** ❌ PENDING
- **Tasks:**
  - [ ] Show locked amount.
  - [ ] Show unlock date / countdown.
  - [ ] Display "simulated growth" (MVP).
  - [ ] Visual vault representation.

### Issue #FE-12: Transaction History
**Category:** `[UI]`
**Status:** ❌ PENDING
- **Tasks:**
  - [ ] List of received transfers.
  - [ ] Show goal, amount, lock status.
  - [ ] Filter by status (available/locked).

---

## 🧪 Phase 5: Testing & Polish

### Issue #FE-13: Error Handling
**Category:** `[ERROR]`
**Status:** ❌ PENDING
- **Tasks:**
  - [ ] Handle wallet not installed.
  - [ ] Handle invalid address.
  - [ ] Handle insufficient balance.
  - [ ] Handle network errors.

### Issue #FE-14: Responsive Design
**Category:** `[UI]`
**Status:** ❌ PENDING
- [ ] Test on mobile devices.
- [ ] Optimize for small screens.
- [ ] PWA manifest setup.