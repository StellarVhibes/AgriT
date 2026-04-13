# Smart Contract Issues - IntentRemit 🔐

This document tracks the detailed development tasks for IntentRemit Soroban smart contracts.

---

## 🏛️ Core Vault Architecture

### Issue #SC-1: Growth Vault Initialization
**Priority:** Critical
**Status:** ❌ PENDING
**Description:** Initialize the Growth Vault contract structure for time-locked funds.
- **Tasks:**
  - [ ] Initialize `growth_vault` project.
  - [ ] Define `DataKey` enum: `Owner`, `LockedAmount`, `UnlockTime`, `Goal`.
  - [ ] Implement `init(env, owner: Address, unlock_time: u64)` function.
  - [ ] Store the goal type (school fees, rent, business, etc.).

### Issue #SC-2: Deposit & Lock Logic
**Priority:** Critical
**Status:** ❌ PENDING
**Description:** Accept funds and lock them until unlock time.
- **Tasks:**
  - [ ] Implement `deposit(env, from: Address, amount: i128)`.
  - [ ] Implement `lock_funds(env, amount: i128, unlock_time: u64)`.
  - [ ] Store locked amount separately from available balance.
  - [ ] Emit `Deposit` and `Lock` events.

### Issue #SC-3: Conditional Release
**Priority:** Critical
**Status:** ❌ PENDING
**Description:** Enforce split rules (e.g., 60% now, 40% later).
- **Tasks:**
  - [ ] Implement `set_release_schedule(env, immediate_pct: u32, locked_pct: u32)`.
  - [ ] Calculate immediate vs locked amounts on deposit.
  - [ ] Only allow locked funds to be withdrawn after unlock time.

---

## ⚙️ Goal Management

### Issue #SC-4: Goal Tracking
**Priority:** High
**Status:** ❌ PENDING
**Description:** Track the purpose of each remittance.
- **Tasks:**
  - [ ] Define `Goal` enum: `SchoolFees`, `Rent`, `BusinessCapital`, `Custom`.
  - [ ] Store goal metadata with vault.
  - [ ] Query function: `get_goal(env) -> Goal`.

### Issue #SC-5: Multiple Vaults (Future)
**Priority:** Medium
**Status:** ❌ PENDING
**Description:** Support multiple locked portions for different goals.
- **Tasks:**
  - [ ] Implement vault registry.
  - [ ] Track multiple unlock times.
  - [ ] Query: `get_vaults(env, owner: Address) -> Vec<Vault>`.

---

## 🔒 Access Control

### Issue #SC-6: Owner-Only Withdrawals
**Priority:** High
**Status:** ❌ PENDING
**Description:** Only the vault owner can withdraw funds.
- **Tasks:**
  - [ ] Implement authorization check using Soroban Auth.
  - [ ] Only owner can call `withdraw`.
  - [ ] Time-check: locked funds only available after unlock_time.

---

## 🧪 Testing

### Issue #SC-7: Time-Lock Tests
**Priority:** High
**Status:** ❌ PENDING
**Description:** Verify time-lock behavior.
- **Tasks:**
  - [ ] Test deposit and lock.
  - [ ] Test early withdrawal fails.
  - [ ] Test successful withdrawal after unlock time.
  - [ ] Test conditional split calculation.