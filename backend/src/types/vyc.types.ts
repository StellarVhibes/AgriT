export type VycStatus = 'Active' | 'Redeemed' | 'Expired' | 'Cancelled';

export const VYC_STATUSES: VycStatus[] = ['Active', 'Redeemed', 'Expired', 'Cancelled'];

/**
 * Mirror of the on-chain `VycRecord` struct in the AgriTrust
 * `volatility_shield` contract. Quantities decode from Soroban i128/u64 as
 * JS numbers here; feel free to range-check against the fee-bump limits.
 */
export interface VycRecord {
  id: number;
  farmer: string;
  score: number;
  /** Expected harvest value in micro-USDC (6 decimals). */
  expectedYield: number;
  crop: string;
  region: string;
  /** 64-char lowercase hex SHA-256 of the proof-of-activity payload. */
  activityHash: string;
  status: VycStatus;
  createdAt: number;
  updatedAt: number;
}

/**
 * A single verified proof-of-activity event submitted through the USSD/mobile
 * gateway and scored by the backend before a VYC is minted.
 */
export interface ActivityEntry {
  /** Activity type, e.g. seed_purchase, planting, farm_log, harvest_log, sales. */
  type: string;
  /** Nominal value of the activity in USDC-equivalent units (used for the volume factor). */
  amount: number;
  /** Unix seconds when the activity was logged. */
  timestamp: number;
  /** ISO 3166-2 region code, e.g. NG-LA. */
  region: string;
}

export interface ScoreResult {
  score: number; // 0-100
  label: 'low' | 'medium' | 'high';
  factors: {
    base: number;
    consistency: number;
    recency: number;
    volume: number;
    diversity: number;
  };
  explanation: string;
  /** SHA-256 over the canonical activity series — matching what is stored on-chain. */
  activityHash: string;
  timestamp: number;
  /** Expected harvest value in USDC-equivalent units, derived from the activity events. */
  expectedHarvestValue: number;
}

export interface MintVycRequest {
  /** Farmer's Stellar address. */
  farmer: string;
  /** Expected harvest value in micro-USDC (6 decimals). */
  expectedYield: number;
  /** Crop identifier, e.g. MAIZE, COCOA, SOYBEAN. */
  crop: string;
  /** ISO 3166-2 region, e.g. NG-LA. */
  region: string;
  /**
   * Pre-computed credit score (0-100). When omitted, it is derived from
   * `activities` via the scoring engine.
   */
  score?: number;
  /** Verified proof-of-activity events used to score the farmer. */
  activities?: ActivityEntry[];
  /**
   * SHA-256 hex of the proof payload. When omitted it is derived from the
   * canonical serialization of `activities` (or from `activityPayload`).
   */
  activityHash?: string;
  /** Raw proof payload to hash when neither `activityHash` nor `activities` is given. */
  activityPayload?: string;
  /** Simulate the call without submitting it on-chain. */
  dryRun?: boolean;
}

export interface ContractWriteResult {
  success: boolean;
  txHash?: string;
  dryRun?: boolean;
  error?: string;
}

export interface DecodedContractEvent {
  id: string;
  type: 'contract' | 'system' | 'diagnostic';
  ledger: number;
  ledgerClosedAt: string;
  pagingToken: string;
  txHash: string;
  successful: boolean;
  topic: unknown[];
  value: unknown;
}