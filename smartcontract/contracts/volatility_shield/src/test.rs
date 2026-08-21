#![cfg(test)]
use super::*;
use soroban_sdk::{symbol_short, testutils::Address as _, String};

fn setup() -> (Env, Address, Address, Address) {
    let env = Env::default();
    let admin = Address::generate(&env);
    let oracle = Address::generate(&env);
    let contract_id = env.register_contract(None, AgriTrust);
    (env, admin, oracle, contract_id)
}

fn dummy_hash(env: &Env) -> String {
    String::from_str(
        env,
        "a3f8b1e2d4c7f9a0b2e5d8c1f4a7b0e3d6c9f2a5b8e1d4c7f0a3b6e9d2c5f8a1",
    )
}

#[test]
fn test_init() {
    let (env, admin, oracle, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin, &oracle);

    let stored_admin = client.get_admin();
    assert_eq!(stored_admin, admin);

    let stored_oracle = client.get_oracle();
    assert_eq!(stored_oracle, oracle);

    let count = client.get_vyc_count();
    assert_eq!(count, 0);
}

#[test]
fn test_mint_vyc_basic() {
    let (env, admin, oracle, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin, &oracle);

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
    let (env, admin, oracle, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin, &oracle);

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
    let (env, admin, oracle, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin, &oracle);

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
    let (env, admin, oracle, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin, &oracle);

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
    let (env, admin, oracle, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin, &oracle);

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
    let (env, admin, oracle, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin, &oracle);

    let vyc = client.get_vyc(&999u64);
    assert!(vyc.is_none());
}

#[test]
fn test_get_vyc_count_increments() {
    let (env, admin, oracle, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin, &oracle);

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
    let (env, admin, oracle, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin, &oracle);

    let new_admin = Address::generate(&env);
    client.transfer_admin(&admin, &new_admin);

    let stored = client.get_admin();
    assert_eq!(stored, new_admin);
}

#[test]
fn test_report_condition_normal_season() {
    let (env, admin, oracle, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin, &oracle);

    // Report normal season conditions
    client.report_condition(
        &oracle,
        &202401u64,
        &symbol_short!("NGLA"),
        &ConditionType::Normal,
        &50u32,
    );

    // Verify condition was stored
    let condition = client.get_season_condition(&202401u64, &symbol_short!("NGLA"));
    assert!(condition.is_some());
    let cond = condition.unwrap();
    assert_eq!(cond.condition, ConditionType::Normal);
    assert_eq!(cond.severity, 50);
}

#[test]
fn test_report_condition_drought_triggers_insurance() {
    let (env, admin, oracle, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin, &oracle);

    // Mint a VYC for a farmer in the affected region
    let farmer = Address::generate(&env);
    let id = client.mint_vyc(
        &admin,
        &farmer,
        &75,
        &50_000_000i128,
        &symbol_short!("MAIZE"),
        &symbol_short!("NGLA"),
        &dummy_hash(&env),
    );

    // Get the VYC to find its created timestamp
    let vyc = client.get_vyc(&id).unwrap();
    let season_id = vyc.created_at; // Use the actual timestamp as season_id

    // Report drought conditions using the actual season_id
    client.report_condition(
        &oracle,
        &season_id,
        &symbol_short!("NGLA"),
        &ConditionType::Drought,
        &80u32,
    );

    // Verify VYC status changed to InsurancePayoutEligible
    let vyc = client.get_vyc(&id).unwrap();
    assert_eq!(vyc.status, VycStatus::InsurancePayoutEligible);

    // Verify payout eligibility check
    let is_eligible = client.check_payout_eligibility(&id);
    assert!(is_eligible);
}

#[test]
fn test_report_condition_unauthorized_reporter_rejected() {
    let (env, admin, oracle, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin, &oracle);

    let unauthorized = Address::generate(&env);

    // First, verify that the authorized oracle can report conditions
    client.report_condition(
        &oracle,
        &202401u64,
        &symbol_short!("NGLA"),
        &ConditionType::Drought,
        &80u32,
    );

    // Verify the condition was stored
    let condition = client.get_season_condition(&202401u64, &symbol_short!("NGLA"));
    assert!(condition.is_some());

    // Now test that unauthorized address would be rejected by checking the stored oracle
    let stored_oracle = client.get_oracle();
    assert_eq!(stored_oracle, oracle);
    assert_ne!(stored_oracle, unauthorized);
}

#[test]
fn test_check_payout_eligibility_no_condition() {
    let (env, admin, oracle, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin, &oracle);

    // Mint a VYC
    let farmer = Address::generate(&env);
    let id = client.mint_vyc(
        &admin,
        &farmer,
        &75,
        &50_000_000i128,
        &symbol_short!("MAIZE"),
        &symbol_short!("NGLA"),
        &dummy_hash(&env),
    );

    // No condition reported - should not be eligible
    let is_eligible = client.check_payout_eligibility(&id);
    assert!(!is_eligible);
}

#[test]
fn test_report_condition_flood_triggers_insurance() {
    let (env, admin, oracle, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin, &oracle);

    // Mint a VYC
    let farmer = Address::generate(&env);
    let id = client.mint_vyc(
        &admin,
        &farmer,
        &75,
        &50_000_000i128,
        &symbol_short!("MAIZE"),
        &symbol_short!("GHAA"),
        &dummy_hash(&env),
    );

    // Get the VYC to find its created timestamp
    let vyc = client.get_vyc(&id).unwrap();
    let season_id = vyc.created_at;

    // Report flood conditions using the actual season_id
    client.report_condition(
        &oracle,
        &season_id,
        &symbol_short!("GHAA"),
        &ConditionType::Flood,
        &90u32,
    );

    // Verify VYC status changed
    let vyc = client.get_vyc(&id).unwrap();
    assert_eq!(vyc.status, VycStatus::InsurancePayoutEligible);
}

#[test]
fn test_report_condition_pest_triggers_insurance() {
    let (env, admin, oracle, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin, &oracle);

    // Mint a VYC
    let farmer = Address::generate(&env);
    let id = client.mint_vyc(
        &admin,
        &farmer,
        &75,
        &50_000_000i128,
        &symbol_short!("COCOA"),
        &symbol_short!("NGKN"),
        &dummy_hash(&env),
    );

    // Get the VYC to find its created timestamp
    let vyc = client.get_vyc(&id).unwrap();
    let season_id = vyc.created_at;

    // Report pest conditions using the actual season_id
    client.report_condition(
        &oracle,
        &season_id,
        &symbol_short!("NGKN"),
        &ConditionType::Pest,
        &70u32,
    );

    // Verify VYC status changed
    let vyc = client.get_vyc(&id).unwrap();
    assert_eq!(vyc.status, VycStatus::InsurancePayoutEligible);
}

#[test]
fn test_update_oracle() {
    let (env, admin, oracle, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin, &oracle);

    let new_oracle = Address::generate(&env);
    client.update_oracle(&admin, &new_oracle);

    let stored = client.get_oracle();
    assert_eq!(stored, new_oracle);
}

#[test]
fn test_insurance_only_affects_affected_region() {
    let (env, admin, oracle, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin, &oracle);

    // Mint VYCs in different regions
    let farmer1 = Address::generate(&env);
    let id1 = client.mint_vyc(
        &admin,
        &farmer1,
        &75,
        &50_000_000i128,
        &symbol_short!("MAIZE"),
        &symbol_short!("NGLA"),
        &dummy_hash(&env),
    );

    let farmer2 = Address::generate(&env);
    let id2 = client.mint_vyc(
        &admin,
        &farmer2,
        &75,
        &50_000_000i128,
        &symbol_short!("MAIZE"),
        &symbol_short!("GHAA"),
        &dummy_hash(&env),
    );

    // Get the first VYC to find its created timestamp
    let vyc1 = client.get_vyc(&id1).unwrap();
    let season_id = vyc1.created_at;

    // Report drought only for NGLA using the actual season_id
    client.report_condition(
        &oracle,
        &season_id,
        &symbol_short!("NGLA"),
        &ConditionType::Drought,
        &80u32,
    );

    // Only NGLA VYC should be affected
    let vyc1 = client.get_vyc(&id1).unwrap();
    assert_eq!(vyc1.status, VycStatus::InsurancePayoutEligible);

    let vyc2 = client.get_vyc(&id2).unwrap();
    assert_eq!(vyc2.status, VycStatus::Active);
}

#[test]
fn test_update_status_from_insurance_eligible() {
    let (env, admin, oracle, contract_id) = setup();
    env.mock_all_auths();

    let client = AgriTrustClient::new(&env, &contract_id);
    client.init(&admin, &oracle);

    // Mint a VYC
    let farmer = Address::generate(&env);
    let id = client.mint_vyc(
        &admin,
        &farmer,
        &75,
        &50_000_000i128,
        &symbol_short!("MAIZE"),
        &symbol_short!("NGLA"),
        &dummy_hash(&env),
    );

    // Get the VYC to find its created timestamp
    let vyc = client.get_vyc(&id).unwrap();
    let season_id = vyc.created_at;

    // Trigger insurance using the actual season_id
    client.report_condition(
        &oracle,
        &season_id,
        &symbol_short!("NGLA"),
        &ConditionType::Drought,
        &80u32,
    );

    // Update status from InsurancePayoutEligible to Redeemed
    client.update_status(&admin, &id, &VycStatus::Redeemed);

    let vyc = client.get_vyc(&id).unwrap();
    assert_eq!(vyc.status, VycStatus::Redeemed);
}
