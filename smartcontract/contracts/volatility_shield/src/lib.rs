#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, Address, Env, String, Symbol, Vec,
};

// ─── Storage Keys ────────────────────────────────────────────────────────────

#[contracttype]
pub enum DataKey {
    Admin,
    VycCounter,
    Vyc(u64),                 // VYC id → VycRecord
    FarmerVycs(Address),      // farmer address → Vec<u64> (their VYC ids)
    ConditionCounter,         // global condition id counter
    SeasonCondition(u64),     // condition_id → SeasonCondition
    RegionConditions(Symbol), // region → Vec<u64> (condition ids for that region)
    VycInsurancePayout(u64),  // vyc_id → InsurancePayout
}

// ─── Types ───────────────────────────────────────────────────────────────────

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
#[contracttype]
pub enum VycStatus {
    Active,    // Certificate minted, awaiting harvest
    Redeemed,  // Farmer claimed payout / loan settled
    Expired,   // Harvest window passed without redemption
    Cancelled, // Admin-cancelled (e.g., verified fraud)
}

/// Verifiable Yield Certificate — the core primitive of AgriTrust.
///
/// Represents a farmer's expected harvest value, backed by verified
/// proof-of-activity (seed purchase, planting log, etc.).
///
/// score:           AgriTrust credit score at time of minting (0-100).
///                  Integrates with FluxID scoring via the backend.
/// expected_yield:  Expected harvest value in micro-USDC (6 decimal places).
///                  e.g. 50_000_000 = 50 USDC.
/// crop:            Short crop identifier: "MAIZE", "COCOA", "SOYBEAN" etc.
/// region:          ISO 3166-2 region code, e.g. "NG-LA" (Lagos, Nigeria).
/// activity_hash:   SHA-256 of the proof-of-activity payload (receipt hash,
///                  anchor transaction id, etc.) for on-chain auditability.
#[contracttype]
pub struct VycRecord {
    pub id: u64,
    pub farmer: Address,
    pub score: u32,
    pub expected_yield: i128,
    pub crop: Symbol,
    pub region: Symbol,
    pub activity_hash: String, // 64-char hex SHA-256
    pub status: VycStatus,
    pub created_at: u64,
    pub updated_at: u64,
}

/// Errors returned by minting (issue #7).
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum MintError {
    NotInitialized = 1,
    Unauthorized = 2,
    ScoreOutOfRange = 3,
    InvalidYield = 4,
    InvalidActivityHash = 5,
}

// ─── Parametric Insurance Types ─────────────────────────────────────────────

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
#[contracttype]
pub enum ConditionType {
    Drought,
    Flood,
    Heatwave,
    Frost,
}

/// A season-level weather condition reported by an authorized oracle/admin.
/// When active, VYCs in the matching region become eligible for partial payout.
#[contracttype]
pub struct SeasonCondition {
    pub condition: ConditionType,
    pub region: Symbol,
    pub season: Symbol,
    pub severity: u32, // 0–100
    pub reported_by: Address,
    pub reported_at: u64,
    pub active: bool,
}

/// Record of an insurance payout triggered for a VYC.
#[contracttype]
pub struct InsurancePayout {
    pub vyc_id: u64,
    pub condition_id: u64,
    pub payout_amount: i128, // micro-USDC
    pub triggered_at: u64,
    pub claimed: bool,
}

/// Errors returned by insurance operations.
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum InsuranceError {
    NotInitialized = 10,
    Unauthorized = 11,
    VycNotActive = 12,
    NoActiveCondition = 13,
    SeverityTooLow = 14,
    AlreadyTriggered = 15,
    ConditionNotFound = 16,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/// Deterministic payout: expected_yield * severity / 100.
/// Both `check_insurance_eligibility` and `trigger_insurance_payout` use this
/// formula; keeping it in one place avoids subtle drift.
fn compute_payout(expected_yield: i128, severity: u32) -> i128 {
    expected_yield * (severity as i128) / 100
}

// ─── Contract ────────────────────────────────────────────────────────────────

#[contract]
pub struct AgriTrust;

#[contractimpl]
impl AgriTrust {
    // ── Admin ──────────────────────────────────────────────────────────────

    pub fn init(env: Env, admin: Address) {
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::VycCounter, &0u64);
    }

    pub fn get_admin(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic!("Not initialised"))
    }

    pub fn transfer_admin(env: Env, admin: Address, new_admin: Address) {
        admin.require_auth();
        let stored: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic!("Not initialised"));
        if admin != stored {
            panic!("Unauthorized");
        }
        env.storage().instance().set(&DataKey::Admin, &new_admin);
    }

    // ── Mint VYC ───────────────────────────────────────────────────────────

    /// Mint a new Verifiable Yield Certificate for a farmer.
    ///
    /// Called by the AgriTrust backend after:
    ///   1. Farmer logs a verified proof-of-activity (seed purchase from anchor).
    ///   2. Backend computes the credit score (via FluxID scoring engine).
    ///   3. Backend verifies the activity hash against the anchor transaction.
    ///
    /// admin:           The protocol admin keypair (backend-controlled).
    /// farmer:          The farmer's Stellar wallet address.
    /// score:           Credit score at time of minting (0-100).
    /// expected_yield:  Expected harvest value in micro-USDC.
    /// crop:            Crop identifier symbol.
    /// region:          Region code symbol.
    /// activity_hash:   SHA-256 hex of the proof-of-activity payload.
    #[allow(clippy::too_many_arguments)]
    pub fn mint_vyc(
        env: Env,
        admin: Address,
        farmer: Address,
        score: u32,
        expected_yield: i128,
        crop: Symbol,
        region: Symbol,
        activity_hash: String,
    ) -> Result<u64, MintError> {
        admin.require_auth();

        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(MintError::NotInitialized)?;

        if admin != stored_admin {
            return Err(MintError::Unauthorized);
        }

        if score > 100 {
            return Err(MintError::ScoreOutOfRange);
        }

        if expected_yield <= 0 {
            return Err(MintError::InvalidYield);
        }

        // activity_hash must be a 64-char lowercase hex SHA-256 string
        // (see hashActivityPayload in the backend scoring service).
        // Length gate FIRST: copy_into_slice requires an exactly-sized
        // buffer, so a short/long hash must be rejected before copying.
        // (hex chars are ASCII so bytes == chars here)
        if activity_hash.len() != 64 {
            return Err(MintError::InvalidActivityHash);
        }
        let mut hash_bytes = [0u8; 64];
        activity_hash.copy_into_slice(&mut hash_bytes);
        if !hash_bytes
            .iter()
            .all(|b| matches!(b, b'0'..=b'9' | b'a'..=b'f'))
        {
            return Err(MintError::InvalidActivityHash);
        }

        // Increment the global VYC counter to get a unique ID.
        let id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::VycCounter)
            .unwrap_or(0u64);
        let new_id = id + 1;
        env.storage().instance().set(&DataKey::VycCounter, &new_id);

        let now = env.ledger().timestamp();

        let vyc = VycRecord {
            id: new_id,
            farmer: farmer.clone(),
            score,
            expected_yield,
            crop: crop.clone(),
            region: region.clone(),
            activity_hash,
            status: VycStatus::Active,
            created_at: now,
            updated_at: now,
        };

        env.storage().persistent().set(&DataKey::Vyc(new_id), &vyc);

        // Append this VYC id to the farmer's list.
        let mut farmer_vycs: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::FarmerVycs(farmer.clone()))
            .unwrap_or_else(|| Vec::new(&env));
        farmer_vycs.push_back(new_id);
        env.storage()
            .persistent()
            .set(&DataKey::FarmerVycs(farmer.clone()), &farmer_vycs);

        // Emit a VycMinted event for off-chain indexers (liquidity providers,
        // insurance oracles, etc.) to observe new certificates.
        env.events().publish(
            (Symbol::new(&env, "vyc_minted"), farmer.clone()),
            (new_id, score, expected_yield, crop, region, now),
        );

        Ok(new_id)
    }

    // ── Query ──────────────────────────────────────────────────────────────

    pub fn get_vyc(env: Env, id: u64) -> Option<VycRecord> {
        env.storage().persistent().get(&DataKey::Vyc(id))
    }

    /// Token-style metadata: human-readable certificate name.
    pub fn name(env: Env) -> String {
        String::from_str(&env, "AgriTrust Yield Certificate")
    }

    /// Token-style metadata: ticker symbol for the VYC asset.
    pub fn symbol(env: Env) -> Symbol {
        Symbol::new(&env, "VYC")
    }

    /// Full VYC records for one farmer — the frontend "My certificates" list
    /// uses this so it renders without N+1 `get_vyc` reads per id.
    pub fn get_farmer_vyc_records(env: Env, farmer: Address) -> Vec<VycRecord> {
        let ids: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::FarmerVycs(farmer))
            .unwrap_or_else(|| Vec::new(&env));

        let mut records = Vec::new(&env);
        for id in ids.iter() {
            if let Some(vyc) = env.storage().persistent().get(&DataKey::Vyc(id)) {
                records.push_back(vyc);
            }
        }
        records
    }

    /// All VYC IDs for a given farmer address.
    pub fn get_farmer_vycs(env: Env, farmer: Address) -> Vec<u64> {
        env.storage()
            .persistent()
            .get(&DataKey::FarmerVycs(farmer))
            .unwrap_or_else(|| Vec::new(&env))
    }

    pub fn get_vyc_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::VycCounter)
            .unwrap_or(0)
    }

    // ── Status Updates ─────────────────────────────────────────────────────

    /// Update the status of a VYC (e.g. mark as Redeemed after payout).
    /// Only admin can call this — farmer cannot self-redeem to prevent fraud.
    pub fn update_status(env: Env, admin: Address, id: u64, new_status: VycStatus) {
        admin.require_auth();

        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic!("Not initialised"));

        if admin != stored_admin {
            panic!("Unauthorized");
        }

        let mut vyc: VycRecord = env
            .storage()
            .persistent()
            .get(&DataKey::Vyc(id))
            .unwrap_or_else(|| panic!("VYC not found"));

        if vyc.status != VycStatus::Active {
            panic!("Can only update Active VYCs");
        }

        let now = env.ledger().timestamp();
        vyc.status = new_status;
        vyc.updated_at = now;

        env.storage().persistent().set(&DataKey::Vyc(id), &vyc);

        // Emit a status-change event for liquidity providers and insurance oracles.
        env.events()
            .publish((Symbol::new(&env, "vyc_status"), id), (new_status, now));
    }

    // ── Parametric Insurance ──────────────────────────────────────────────

    /// Report a season-level weather condition (e.g. drought) for a region.
    /// Only admin can report. Returns the new condition id.
    pub fn report_condition(
        env: Env,
        admin: Address,
        condition: ConditionType,
        region: Symbol,
        season: Symbol,
        severity: u32,
    ) -> Result<u64, InsuranceError> {
        admin.require_auth();

        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(InsuranceError::NotInitialized)?;

        if admin != stored_admin {
            return Err(InsuranceError::Unauthorized);
        }

        if severity == 0 || severity > 100 {
            return Err(InsuranceError::SeverityTooLow);
        }

        let id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::ConditionCounter)
            .unwrap_or(0u64);
        let new_id = id + 1;
        env.storage()
            .instance()
            .set(&DataKey::ConditionCounter, &new_id);

        let now = env.ledger().timestamp();

        let condition_record = SeasonCondition {
            condition,
            region: region.clone(),
            season: season.clone(),
            severity,
            reported_by: admin.clone(),
            reported_at: now,
            active: true,
        };

        env.storage()
            .persistent()
            .set(&DataKey::SeasonCondition(new_id), &condition_record);

        // Append condition id to the region's list.
        let mut region_conditions: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::RegionConditions(region.clone()))
            .unwrap_or_else(|| Vec::new(&env));
        region_conditions.push_back(new_id);
        env.storage().persistent().set(
            &DataKey::RegionConditions(region.clone()),
            &region_conditions,
        );

        // Emit event for off-chain tracking.
        env.events().publish(
            (Symbol::new(&env, "condition_reported"), new_id),
            (condition, region, season, severity, now),
        );

        Ok(new_id)
    }

    /// Deactivate a season condition so it can no longer trigger payouts.
    pub fn deactivate_condition(
        env: Env,
        admin: Address,
        condition_id: u64,
    ) -> Result<(), InsuranceError> {
        admin.require_auth();

        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(InsuranceError::NotInitialized)?;

        if admin != stored_admin {
            return Err(InsuranceError::Unauthorized);
        }

        let mut cond: SeasonCondition = env
            .storage()
            .persistent()
            .get(&DataKey::SeasonCondition(condition_id))
            .ok_or(InsuranceError::ConditionNotFound)?;

        cond.active = false;
        env.storage()
            .persistent()
            .set(&DataKey::SeasonCondition(condition_id), &cond);

        Ok(())
    }

    /// Read a condition by id.
    pub fn get_condition(env: Env, condition_id: u64) -> Option<SeasonCondition> {
        env.storage()
            .persistent()
            .get(&DataKey::SeasonCondition(condition_id))
    }

    /// All condition ids for a given region.
    pub fn get_region_conditions(env: Env, region: Symbol) -> Vec<u64> {
        env.storage()
            .persistent()
            .get(&DataKey::RegionConditions(region))
            .unwrap_or_else(|| Vec::new(&env))
    }

    /// Deterministic payout eligibility check.
    ///
    /// Returns `Some(InsurancePayout)` if:
    ///   - The VYC is `Active`
    ///   - There is an active `SeasonCondition` for the VYC's region
    ///   - Severity > 0
    ///
    /// Payout amount = `expected_yield * severity / 100`.
    pub fn check_insurance_eligibility(env: Env, vyc_id: u64) -> Option<InsurancePayout> {
        let vyc: VycRecord = env.storage().persistent().get(&DataKey::Vyc(vyc_id))?;

        if vyc.status != VycStatus::Active {
            return None;
        }

        // Find the most severe active condition for this VYC's region.
        let condition_ids: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::RegionConditions(vyc.region))
            .unwrap_or_else(|| Vec::new(&env));

        let mut best_severity: u32 = 0;
        let mut best_condition_id: u64 = 0;

        for cid in condition_ids.iter() {
            if let Some(cond) = env
                .storage()
                .persistent()
                .get::<DataKey, SeasonCondition>(&DataKey::SeasonCondition(cid))
            {
                if cond.active && cond.severity > best_severity {
                    best_severity = cond.severity;
                    best_condition_id = cid;
                }
            }
        }

        if best_severity == 0 {
            return None;
        }

        let payout_amount = compute_payout(vyc.expected_yield, best_severity);

        Some(InsurancePayout {
            vyc_id,
            condition_id: best_condition_id,
            payout_amount,
            triggered_at: env.ledger().timestamp(),
            claimed: false,
        })
    }

    /// Trigger an insurance payout for a VYC.
    ///
    /// Admin-only. Validates eligibility deterministically, stores the payout
    /// record, and emits an event for off-chain oracles/liquidity providers.
    pub fn trigger_insurance_payout(
        env: Env,
        admin: Address,
        vyc_id: u64,
        condition_id: u64,
    ) -> Result<InsurancePayout, InsuranceError> {
        admin.require_auth();

        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(InsuranceError::NotInitialized)?;

        if admin != stored_admin {
            return Err(InsuranceError::Unauthorized);
        }

        // VYC must exist and be Active.
        let vyc: VycRecord = env
            .storage()
            .persistent()
            .get(&DataKey::Vyc(vyc_id))
            .ok_or(InsuranceError::VycNotActive)?;

        if vyc.status != VycStatus::Active {
            return Err(InsuranceError::VycNotActive);
        }

        // Condition must exist and be active.
        let cond: SeasonCondition = env
            .storage()
            .persistent()
            .get(&DataKey::SeasonCondition(condition_id))
            .ok_or(InsuranceError::ConditionNotFound)?;

        if !cond.active {
            return Err(InsuranceError::NoActiveCondition);
        }

        // Condition must be for the same region as the VYC.
        if cond.region != vyc.region {
            return Err(InsuranceError::NoActiveCondition);
        }

        // Must not already have a payout for this VYC.
        let existing: Option<InsurancePayout> = env
            .storage()
            .persistent()
            .get(&DataKey::VycInsurancePayout(vyc_id));
        if existing.is_some() {
            return Err(InsuranceError::AlreadyTriggered);
        }

        let payout_amount = compute_payout(vyc.expected_yield, cond.severity);
        let now = env.ledger().timestamp();

        let payout = InsurancePayout {
            vyc_id,
            condition_id,
            payout_amount,
            triggered_at: now,
            claimed: false,
        };

        env.storage()
            .persistent()
            .set(&DataKey::VycInsurancePayout(vyc_id), &payout);

        // Emit event for off-chain tracking.
        env.events().publish(
            (Symbol::new(&env, "insurance_triggered"), vyc_id),
            (condition_id, payout_amount, now),
        );

        Ok(payout)
    }

    /// Query the insurance payout record for a VYC (if any).
    pub fn get_vyc_payout(env: Env, vyc_id: u64) -> Option<InsurancePayout> {
        env.storage()
            .persistent()
            .get(&DataKey::VycInsurancePayout(vyc_id))
    }
}

mod test;
