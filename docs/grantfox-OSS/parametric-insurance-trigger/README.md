# Parametric Insurance Trigger - Evidence

**Closes #3**: On-chain parametric insurance trigger for drought conditions in VYC contract

## Summary

Implemented the first on-chain parametric insurance trigger in the `agritrust_vyc` Soroban contract. When an authorized admin reports a season-level weather condition (e.g. drought), VYCs in the matching region automatically become eligible for a deterministic partial payout.

**Payout formula:** `expected_yield * severity / 100`

## What Changed

### Smart Contract
- 7 new functions: `report_condition`, `deactivate_condition`, `get_condition`, `get_region_conditions`, `check_insurance_eligibility`, `trigger_insurance_payout`, `get_vyc_payout`
- 3 new types: `ConditionType` (Drought/Flood/Heatwave/Frost), `SeasonCondition`, `InsurancePayout`
- 7 error variants: `InsuranceError` with typed error handling
- 2 events: `condition_reported`, `insurance_triggered`
- Shared `compute_payout` helper for deterministic calculation

### Tests (27 total - all passing)
- 12 new insurance tests covering: report, deactivate, trigger, eligibility, unauthorized access, region mismatch, severity impact, and error cases

### Backend Integration
- TypeScript types: `ConditionType`, `SeasonCondition`, `InsurancePayout`
- 7 contract service methods for insurance operations

### Frontend Integration
- Query functions: `checkInsuranceEligibility`, `getVycPayout`
- TypeScript interfaces: `InsurancePayout`, `InsuranceQueryResult`

## Verification

### Smart Contract Tests
```bash
$ cd smartcontract && cargo test --all
running 27 tests
test test::test_report_condition ... ok
test test::test_report_condition_unauthorized ... ok
test test::test_trigger_payout_drought_season ... ok
test test::test_trigger_payout_no_condition ... ok
test test::test_trigger_payout_wrong_region ... ok
test test::test_trigger_payout_inactive_vyc ... ok
test test::test_deactivate_condition ... ok
test test::test_deactivate_condition_unauthorized ... ok
test test::test_deactivate_condition_not_found ... ok
test test::test_get_condition_query ... ok
test test::test_normal_season_no_payout ... ok
test test::test_severity_affects_payout ... ok
...
test result: ok. 27 passed; 0 failed; 0 ignored; 0 measured
```

### Build Verification
```bash
$ cargo fmt --check
$ cargo clippy -- -D warnings -A unexpected_cfgs
$ cargo build --target wasm32-unknown-unknown --release
```

## Live Deployment (Testnet)

- **Contract ID**: `CAP5F2UJVEIDRIQFKN4T2JVW7IZC6KARIJXDV65IZEF7VYOSKRDGWXJU`
- **Network**: Stellar Testnet
- **Deploy Transaction**: [d68a4f46...9c282f](https://stellar.expert/explorer/testnet/tx/d68a4f4689b937c4e388fd43deb0adea39a94726326d618346e03a26519c282f)
- **Init Transaction**: [3918cf37...a0b8e](https://stellar.expert/explorer/testnet/tx/3918cf37383dfd9fac93a7cd58daf6afac54ada9d306a268c41d24a8006a0b8e)
- **Stellar Expert Link**: [Contract Details](https://stellar.expert/explorer/testnet/contract/CAP5F2UJVEIDRIQFKN4T2JVW7IZC6KARIJXDV65IZEF7VYOSKRDGWXJU)
- **Lab Link**: [View in Lab](https://lab.stellar.org/r/testnet/contract/CAP5F2UJVEIDRIQFKN4T2JVW7IZC6KARIJXDV65IZEF7VYOSKRDGWXJU)
- **Status**: ✅ Deployed and initialized on testnet

## Deployment Record

```bash
# Contract deployed successfully
Contract ID: CAP5F2UJVEIDRIQFKN4T2JVW7IZC6KARIJXDV65IZEF7VYOSKRDGWXJU
Deploy TX:   d68a4f4689b937c4e388fd43deb0adea39a94726326d618346e03a26519c282f
Init TX:     3918cf37383dfd9fac93a7cd58daf6afac54ada9d306a268c41d24a8006a0b8e

# Verification
get_admin:    GBUZ2ITYH7YN3SOBZ2POSGRYONBDZRYONPEWHH45X5HMZ3VRJGECB3GP
get_vyc_count: 0
```

## Insurance Flow Example

1. Admin reports drought: `report_condition(Drought, "NGLA", "2026_Q1", 60)`
2. VYC in region NGLA becomes eligible: `check_insurance_eligibility(vyc_id)`
3. Admin triggers payout: `trigger_insurance_payout(admin, vyc_id, condition_id)`
4. Payout recorded: `expected_yield * 60 / 100`

## Acceptance Criteria Met

- [x] Contract function to report a season-level condition (drought)
- [x] Only authorized roles can report conditions (require_auth)
- [x] Payout eligibility computed deterministically from condition + certificate
- [x] Event emitted on trigger for off-chain tracking
- [x] Unit tests: normal season (no payout), drought season (payout eligible), unauthorized rejected
- [x] Reproducible deploy Makefile target
- [x] Backend types and contract service methods
- [x] Frontend service functions for querying insurance
- [x] Documentation updated with insurance trigger usage

---

**Status**: ✅ Deployed to testnet — Contract ID: `CAP5F2UJVEIDRIQFKN4T2JVW7IZC6KARIJXDV65IZEF7VYOSKRDGWXJU`
