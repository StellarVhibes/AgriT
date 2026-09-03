#![cfg(test)]
use super::*;
use soroban_sdk::{symbol_short, testutils::Address as _, String};

fn setup() -> (Env, Address, Address) {
    let env = Env::default();
    let admin = Address::generate(&env);
    let contract_id = env.register_contract(None, AgriTrust);
    (env, admin, contract_id)
}

fn dummy_hash(env: &Env) -> String {
    String::from_str(
        env,
        "a3f8b1e2d4c7f9a0b2e5d8c1f4a7b0e3d6c9f2a5b8e1d4c7f0a3b6e9d2c5f8a1",
    )
}

#[test]
fn test_init() {
    let (env, admin, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin);

    let stored_admin = client.get_admin();
    assert_eq!(stored_admin, admin);

    let count = client.get_vyc_count();
    assert_eq!(count, 0);
}

#[test]
fn test_mint_vyc_basic() {
    let (env, admin, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin);

    let farmer = Address::generate(&env);
    let id = client.mint_vyc(
        &admin,
        &farmer,
        &75,
        &50_000_000i128, // 50 USDC in micro-USDC
        &symbol_short!("MAIZE"),
        &symbol_short!("NGLA"),
        &dummy_hash(&env),
    );

    assert_eq!(id, 1);
    assert_eq!(client.get_vyc_count(), 1);
}

#[test]
fn test_get_vyc_record() {
    let (env, admin, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin);

    let farmer = Address::generate(&env);
    let hash = dummy_hash(&env);
    let id = client.mint_vyc(
        &admin,
        &farmer,
        &80,
        &100_000_000i128, // 100 USDC
        &symbol_short!("COCOA"),
        &symbol_short!("GHAA"),
        &hash,
    );

    let vyc = client.get_vyc(&id);
    assert!(vyc.is_some());

    let record = vyc.unwrap();
    assert_eq!(record.id, 1);
    assert_eq!(record.farmer, farmer);
    assert_eq!(record.score, 80);
    assert_eq!(record.expected_yield, 100_000_000);
    assert_eq!(record.status, VycStatus::Active);
}

#[test]
fn test_farmer_vyc_list() {
    let (env, admin, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin);

    let farmer = Address::generate(&env);

    // Mint 3 VYCs for the same farmer
    client.mint_vyc(
        &admin,
        &farmer,
        &70,
        &30_000_000,
        &symbol_short!("MAIZE"),
        &symbol_short!("NGLA"),
        &dummy_hash(&env),
    );
    client.mint_vyc(
        &admin,
        &farmer,
        &75,
        &50_000_000,
        &symbol_short!("MAIZE"),
        &symbol_short!("NGLA"),
        &dummy_hash(&env),
    );
    client.mint_vyc(
        &admin,
        &farmer,
        &80,
        &80_000_000,
        &symbol_short!("COCOA"),
        &symbol_short!("GHAA"),
        &dummy_hash(&env),
    );

    let farmer_ids = client.get_farmer_vycs(&farmer);
    assert_eq!(farmer_ids.len(), 3);
    assert_eq!(farmer_ids.get(0).unwrap(), 1u64);
    assert_eq!(farmer_ids.get(1).unwrap(), 2u64);
    assert_eq!(farmer_ids.get(2).unwrap(), 3u64);
}

#[test]
fn test_multiple_farmers_isolated() {
    let (env, admin, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin);

    let farmer_a = Address::generate(&env);
    let farmer_b = Address::generate(&env);

    client.mint_vyc(
        &admin,
        &farmer_a,
        &70,
        &40_000_000,
        &symbol_short!("MAIZE"),
        &symbol_short!("NGLA"),
        &dummy_hash(&env),
    );
    client.mint_vyc(
        &admin,
        &farmer_b,
        &85,
        &70_000_000,
        &symbol_short!("SOYA"),
        &symbol_short!("NGKN"),
        &dummy_hash(&env),
    );

    let a_ids = client.get_farmer_vycs(&farmer_a);
    let b_ids = client.get_farmer_vycs(&farmer_b);

    assert_eq!(a_ids.len(), 1);
    assert_eq!(b_ids.len(), 1);
    // IDs are globally unique even across farmers
    assert_eq!(a_ids.get(0).unwrap(), 1u64);
    assert_eq!(b_ids.get(0).unwrap(), 2u64);
}

#[test]
fn test_update_status_redeem() {
    let (env, admin, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin);

    let farmer = Address::generate(&env);
    let id = client.mint_vyc(
        &admin,
        &farmer,
        &72,
        &60_000_000,
        &symbol_short!("MAIZE"),
        &symbol_short!("NGLA"),
        &dummy_hash(&env),
    );

    // Simulate successful harvest — mark as Redeemed
    client.update_status(&admin, &id, &VycStatus::Redeemed);

    let vyc = client.get_vyc(&id).unwrap();
    assert_eq!(vyc.status, VycStatus::Redeemed);
}

#[test]
fn test_get_nonexistent_vyc() {
    let (env, admin, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin);

    let vyc = client.get_vyc(&999u64);
    assert!(vyc.is_none());
}

#[test]
fn test_get_vyc_count_increments() {
    let (env, admin, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin);

    assert_eq!(client.get_vyc_count(), 0);

    let farmer = Address::generate(&env);
    client.mint_vyc(
        &admin,
        &farmer,
        &65,
        &25_000_000,
        &symbol_short!("MAIZE"),
        &symbol_short!("NGLA"),
        &dummy_hash(&env),
    );
    assert_eq!(client.get_vyc_count(), 1);

    client.mint_vyc(
        &admin,
        &farmer,
        &70,
        &35_000_000,
        &symbol_short!("MAIZE"),
        &symbol_short!("NGLA"),
        &dummy_hash(&env),
    );
    assert_eq!(client.get_vyc_count(), 2);
}

#[test]
fn test_transfer_admin() {
    let (env, admin, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin);

    let new_admin = Address::generate(&env);
    client.transfer_admin(&admin, &new_admin);

    let stored = client.get_admin();
    assert_eq!(stored, new_admin);
}

// ── Issue #7: metadata, farmer record query, hash validation ──────────────

#[test]
fn test_metadata_reads() {
    let (env, admin, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin);

    assert_eq!(
        client.name(),
        String::from_str(&env, "AgriTrust Yield Certificate")
    );
    assert_eq!(client.symbol(), Symbol::new(&env, "VYC"));
}

#[test]
fn test_get_farmer_vyc_records_returns_full_records() {
    let (env, admin, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin);
    let farmer = Address::generate(&env);

    client.mint_vyc(
        &admin,
        &farmer,
        &85,
        &120_000_000,
        &Symbol::new(&env, "MAIZE"),
        &symbol_short!("NGLA"),
        &dummy_hash(&env),
    );
    client.mint_vyc(
        &admin,
        &farmer,
        &70,
        &90_000_000,
        &Symbol::new(&env, "COCOA"),
        &symbol_short!("GHAS"),
        &dummy_hash(&env),
    );

    // A second farmer's record must not leak into the first farmer's list.
    let other = Address::generate(&env);
    client.mint_vyc(
        &admin,
        &other,
        &60,
        &10_000_000,
        &Symbol::new(&env, "SOYBEAN"),
        &symbol_short!("NGLA"),
        &dummy_hash(&env),
    );

    let records = client.get_farmer_vyc_records(&farmer);
    assert_eq!(records.len(), 2);

    assert_eq!(records.get(0).unwrap().score, 85);
    assert_eq!(records.get(0).unwrap().crop, Symbol::new(&env, "MAIZE"));
    assert_eq!(records.get(1).unwrap().score, 70);
    assert_eq!(records.get(1).unwrap().farmer, farmer);
}

#[test]
fn test_mint_rejects_short_activity_hash() {
    let (env, admin, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin);
    let farmer = Address::generate(&env);
    let short = String::from_str(&env, "a3f8b1e2");

    let res = client.try_mint_vyc(
        &admin,
        &farmer,
        &85,
        &120_000_000,
        &symbol_short!("MAIZE"),
        &symbol_short!("NGLA"),
        &short,
    );
    assert!(matches!(res, Err(Ok(MintError::InvalidActivityHash))));
}

#[test]
fn test_mint_rejects_non_hex_activity_hash() {
    let (env, admin, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin);
    let farmer = Address::generate(&env);
    let not_hex = String::from_str(
        &env,
        "z3f8b1e2d4c7f9a0b2e5d8c1f4a7b0e3d6c9f2a5b8e1d4c7f0a3b6e9d2c5f8a1",
    );

    let res = client.try_mint_vyc(
        &admin,
        &farmer,
        &85,
        &120_000_000,
        &symbol_short!("MAIZE"),
        &symbol_short!("NGLA"),
        &not_hex,
    );
    assert!(matches!(res, Err(Ok(MintError::InvalidActivityHash))));
}

#[test]
fn test_mint_rejects_uppercase_activity_hash() {
    let (env, admin, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin);
    let farmer = Address::generate(&env);
    let upper = String::from_str(
        &env,
        "A3F8B1E2D4C7F9A0B2E5D8C1F4A7B0E3D6C9F2A5B8E1D4C7F0A3B6E9D2C5F8A1",
    );

    let res = client.try_mint_vyc(
        &admin,
        &farmer,
        &85,
        &120_000_000,
        &symbol_short!("MAIZE"),
        &symbol_short!("NGLA"),
        &upper,
    );
    assert!(matches!(res, Err(Ok(MintError::InvalidActivityHash))));
}

#[test]
fn test_mint_accepts_valid_lowercase_hash() {
    let (env, admin, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin);
    let farmer = Address::generate(&env);

    client.mint_vyc(
        &admin,
        &farmer,
        &85,
        &120_000_000,
        &symbol_short!("MAIZE"),
        &symbol_short!("NGLA"),
        &dummy_hash(&env),
    );
    assert_eq!(client.get_farmer_vyc_records(&farmer).len(), 1);
}

// ── Parametric Insurance Tests ──────────────────────────────────────────────

#[test]
fn test_report_condition() {
    let (env, admin, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin);

    let condition_id = client.report_condition(
        &admin,
        &ConditionType::Drought,
        &symbol_short!("NGLA"),
        &symbol_short!("2026_Q1"),
        &75,
    );

    assert_eq!(condition_id, 1);

    let cond = client.get_condition(&condition_id);
    assert!(cond.is_some());
    let cond = cond.unwrap();
    assert_eq!(cond.condition, ConditionType::Drought);
    assert_eq!(cond.region, symbol_short!("NGLA"));
    assert_eq!(cond.season, symbol_short!("2026_Q1"));
    assert_eq!(cond.severity, 75);
    assert_eq!(cond.reported_by, admin);
    assert!(cond.active);
}

#[test]
fn test_report_condition_unauthorized() {
    let (env, _admin, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&_admin);

    let reporter = Address::generate(&env);
    let res = client.try_report_condition(
        &reporter,
        &ConditionType::Drought,
        &symbol_short!("NGLA"),
        &symbol_short!("2026_Q1"),
        &75,
    );
    assert!(matches!(res, Err(Ok(InsuranceError::Unauthorized))));
}

#[test]
fn test_trigger_payout_drought_season() {
    let (env, admin, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin);

    let farmer = Address::generate(&env);
    let vyc_id = client.mint_vyc(
        &admin,
        &farmer,
        &75,
        &100_000_000i128, // 100 USDC
        &symbol_short!("MAIZE"),
        &symbol_short!("NGLA"),
        &dummy_hash(&env),
    );

    // Report drought in the same region with 60% severity.
    let condition_id = client.report_condition(
        &admin,
        &ConditionType::Drought,
        &symbol_short!("NGLA"),
        &symbol_short!("2026_Q1"),
        &60,
    );

    // Trigger payout.
    let payout = client.trigger_insurance_payout(&admin, &vyc_id, &condition_id);
    assert_eq!(payout.vyc_id, vyc_id);
    assert_eq!(payout.condition_id, condition_id);
    // 100 USDC * 60 / 100 = 60 USDC (60_000_000 micro-USDC)
    assert_eq!(payout.payout_amount, 60_000_000i128);
    assert!(!payout.claimed);

    // Query payout.
    let stored = client.get_vyc_payout(&vyc_id);
    assert!(stored.is_some());
    assert_eq!(stored.unwrap().payout_amount, 60_000_000i128);
}

#[test]
fn test_trigger_payout_no_condition() {
    let (env, admin, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin);

    let farmer = Address::generate(&env);
    let vyc_id = client.mint_vyc(
        &admin,
        &farmer,
        &75,
        &100_000_000i128,
        &symbol_short!("MAIZE"),
        &symbol_short!("NGLA"),
        &dummy_hash(&env),
    );

    // No condition reported — trigger should fail.
    let res = client.try_trigger_insurance_payout(&admin, &vyc_id, &999);
    assert!(matches!(res, Err(Ok(InsuranceError::ConditionNotFound))));
}

#[test]
fn test_trigger_payout_wrong_region() {
    let (env, admin, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin);

    let farmer = Address::generate(&env);
    let vyc_id = client.mint_vyc(
        &admin,
        &farmer,
        &75,
        &100_000_000i128,
        &symbol_short!("MAIZE"),
        &symbol_short!("NGLA"),
        &dummy_hash(&env),
    );

    // Condition in a different region.
    let condition_id = client.report_condition(
        &admin,
        &ConditionType::Drought,
        &symbol_short!("GHAA"),
        &symbol_short!("2026_Q1"),
        &80,
    );

    let res = client.try_trigger_insurance_payout(&admin, &vyc_id, &condition_id);
    assert!(matches!(res, Err(Ok(InsuranceError::NoActiveCondition))));
}

#[test]
fn test_trigger_payout_inactive_vyc() {
    let (env, admin, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin);

    let farmer = Address::generate(&env);
    let vyc_id = client.mint_vyc(
        &admin,
        &farmer,
        &75,
        &100_000_000i128,
        &symbol_short!("MAIZE"),
        &symbol_short!("NGLA"),
        &dummy_hash(&env),
    );

    // Mark VYC as Redeemed (no longer Active).
    client.update_status(&admin, &vyc_id, &VycStatus::Redeemed);

    let condition_id = client.report_condition(
        &admin,
        &ConditionType::Drought,
        &symbol_short!("NGLA"),
        &symbol_short!("2026_Q1"),
        &80,
    );

    let res = client.try_trigger_insurance_payout(&admin, &vyc_id, &condition_id);
    assert!(matches!(res, Err(Ok(InsuranceError::VycNotActive))));
}

#[test]
fn test_deactivate_condition() {
    let (env, admin, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin);

    let condition_id = client.report_condition(
        &admin,
        &ConditionType::Drought,
        &symbol_short!("NGLA"),
        &symbol_short!("2026_Q1"),
        &80,
    );

    client.deactivate_condition(&admin, &condition_id);

    let cond = client.get_condition(&condition_id).unwrap();
    assert!(!cond.active);
}

#[test]
#[should_panic(expected = "Error(Contract, #11)")]
fn test_deactivate_condition_unauthorized() {
    let (env, admin, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin);

    let condition_id = client.report_condition(
        &admin,
        &ConditionType::Drought,
        &symbol_short!("NGLA"),
        &symbol_short!("2026_Q1"),
        &80,
    );

    let non_admin = Address::generate(&env);
    client.deactivate_condition(&non_admin, &condition_id);
}

#[test]
#[should_panic(expected = "Error(Contract, #16)")]
fn test_deactivate_condition_not_found() {
    let (env, admin, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin);

    client.deactivate_condition(&admin, &999);
}

#[test]
fn test_get_condition_query() {
    let (env, admin, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin);

    let id1 = client.report_condition(
        &admin,
        &ConditionType::Drought,
        &symbol_short!("NGLA"),
        &symbol_short!("2026_Q1"),
        &60,
    );
    let id2 = client.report_condition(
        &admin,
        &ConditionType::Flood,
        &symbol_short!("NGLA"),
        &symbol_short!("2026_Q2"),
        &40,
    );
    let id3 = client.report_condition(
        &admin,
        &ConditionType::Drought,
        &symbol_short!("GHAA"),
        &symbol_short!("2026_Q1"),
        &90,
    );

    // Region NGLA should have 2 conditions, GHAA should have 1.
    let nglas = client.get_region_conditions(&symbol_short!("NGLA"));
    assert_eq!(nglas.len(), 2);
    assert_eq!(nglas.get(0).unwrap(), id1);
    assert_eq!(nglas.get(1).unwrap(), id2);

    let ghaas = client.get_region_conditions(&symbol_short!("GHAA"));
    assert_eq!(ghaas.len(), 1);
    assert_eq!(ghaas.get(0).unwrap(), id3);

    // Unknown region returns empty.
    let unknown = client.get_region_conditions(&symbol_short!("XYZ"));
    assert_eq!(unknown.len(), 0);
}

#[test]
fn test_normal_season_no_payout() {
    let (env, admin, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin);

    let farmer = Address::generate(&env);
    let vyc_id = client.mint_vyc(
        &admin,
        &farmer,
        &80,
        &200_000_000i128,
        &symbol_short!("MAIZE"),
        &symbol_short!("NGLA"),
        &dummy_hash(&env),
    );

    // No condition reported — eligibility check returns None.
    let result = client.check_insurance_eligibility(&vyc_id);
    assert!(result.is_none());
}

#[test]
fn test_severity_affects_payout() {
    let (env, admin, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin);

    let farmer_a = Address::generate(&env);
    let farmer_b = Address::generate(&env);

    // Both VYCs in the same region, same expected yield.
    let vyc_a = client.mint_vyc(
        &admin,
        &farmer_a,
        &70,
        &100_000_000i128,
        &symbol_short!("MAIZE"),
        &symbol_short!("NGLA"),
        &dummy_hash(&env),
    );
    let vyc_b = client.mint_vyc(
        &admin,
        &farmer_b,
        &75,
        &100_000_000i128,
        &symbol_short!("MAIZE"),
        &symbol_short!("NGLA"),
        &dummy_hash(&env),
    );

    // Condition with 30% severity.
    let cond_low = client.report_condition(
        &admin,
        &ConditionType::Drought,
        &symbol_short!("NGLA"),
        &symbol_short!("2026_Q1"),
        &30,
    );

    // Eligibility for VYC A with the low-severity condition.
    let payout_a = client.check_insurance_eligibility(&vyc_a);
    assert!(payout_a.is_some());
    assert_eq!(payout_a.unwrap().payout_amount, 30_000_000i128); // 100M * 30 / 100

    // Trigger payout for VYC A.
    let triggered = client.trigger_insurance_payout(&admin, &vyc_a, &cond_low);
    assert_eq!(triggered.vyc_id, vyc_a);

    // Now report a more severe condition (80%).
    let cond_high = client.report_condition(
        &admin,
        &ConditionType::Drought,
        &symbol_short!("NGLA"),
        &symbol_short!("2026_Q1"),
        &80,
    );

    // Eligibility for VYC B should use the higher severity (80 > 30).
    let payout_b = client.check_insurance_eligibility(&vyc_b);
    assert!(payout_b.is_some());
    let payout_b = payout_b.unwrap();
    assert_eq!(payout_b.payout_amount, 80_000_000i128); // 100M * 80 / 100
    assert_eq!(payout_b.condition_id, cond_high);
}
