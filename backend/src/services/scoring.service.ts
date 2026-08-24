import { createHash } from 'crypto';
import type { ActivityEntry, ScoreResult } from '../types/vyc.types.js';

const WINDOW_SECONDS = 180 * 24 * 60 * 60; // 180 days of activity count towards the score

const DEFAULT_WEIGHTS: Record<string, number> = {
  seed_purchase: 1,
  planting: 2,
  farm_log: 1,
  harvest_log: 2,
  sales: 1,
  other: 1,
};

export interface ScoreOptions {
  /** Per-activity-type weights. Unknown activity types are ignored. */
  weights?: Record<string, number>;
  /** Unix-seconds baseline (defaults to now) — mainly for deterministic tests. */
  now?: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * SHA-256 of a proof-of-activity payload, matching the format stored on-chain
 * in `VycRecord.activity_hash` (64-char lowercase hex).
 */
export function hashActivityPayload(payload: string | Record<string, unknown>): string {
  const raw = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return createHash('sha256').update(raw).digest('hex');
}

/**
 * Deterministic rule-based credit score (0-100) for a smallholder farmer,
 * mirroring the off-chain scoring the AgriTrust backend is documented to run
 * before a VYC is minted (see docs/FRONTEND_GUIDE.md).
 *
 * Factors, all clamped to 0-100:
 *   - consistency: density + count of activity over the observed span
 *   - recency:     penalty the further back the last activity is
 *   - volume:      total weighted activity value
 *   - diversity:   number of distinct activity types
 */
export function computeAgriTrustScore(
  activities: ActivityEntry[],
  options: ScoreOptions = {}
): ScoreResult {
  const now = options.now ?? Math.floor(Date.now() / 1000);
  const weights = { ...DEFAULT_WEIGHTS, ...options.weights };

  const activityHash = hashActivityPayload(
    activities
      .slice()
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((a) => `${a.timestamp}:${a.type}:${a.amount}:${a.region}`)
      .join('|')
  );

  const valid = activities.filter(
    (a) => a.timestamp >= now - WINDOW_SECONDS && a.timestamp <= now + 24 * 60 * 60
  );

  if (valid.length === 0) {
    return {
      score: 0,
      label: 'low',
      factors: { base: 0, consistency: 0, recency: 0, volume: 0, diversity: 0 },
      explanation: 'No verified activity in the last 180 days.',
      activityHash,
      timestamp: now,
      expectedHarvestValue: 0,
    };
  }

  const sorted = [...valid].sort((a, b) => a.timestamp - b.timestamp);
  const spanDays = Math.max(1, (sorted[sorted.length - 1].timestamp - sorted[0].timestamp) / 86400);

  const minCountScore = Math.min(100, valid.length * 20);
  const densityScore = Math.min(100, Math.round(100 * (valid.length / spanDays)));
  const consistency = Math.round(0.6 * minCountScore + 0.4 * densityScore);

  const daysSinceLast = Math.max(0, (now - sorted[sorted.length - 1].timestamp) / 86400);
  const recency = clamp(Math.round(100 - daysSinceLast * 10), 0, 100);

  const types = new Set(sorted.map((a) => a.type)).size;
  const diversity = clamp(Math.round(25 * types), 0, 100);

  const totalWeighted = valid.reduce((sum, a) => sum + (weights[a.type] ?? 0) * a.amount, 0);
  const volume = clamp(Math.round(totalWeighted), 0, 100);

  const harvestAmount = valid
    .filter((a) => a.type === 'harvest_log')
    .reduce((sum, a) => sum + a.amount, 0);
  const plantingAmount = valid
    .filter((a) => a.type === 'planting')
    .reduce((sum, a) => sum + a.amount, 0);
  const expectedHarvestValue = harvestAmount > 0
    ? harvestAmount
    : plantingAmount > 0
      ? Math.round(plantingAmount * 1.5)
      : 0;

  const base = 30;
  const score = clamp(
    Math.round(base + consistency * 0.3 + recency * 0.25 + diversity * 0.2 + volume * 0.25),
    0,
    100
  );

  const label = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';

  return {
    score,
    label,
    factors: { base, consistency, recency, volume, diversity },
    explanation: `Score ${score}/100 from ${valid.length} verified activit${valid.length === 1 ? 'y' : 'ies'} across ${Math.round(spanDays)} day(s), ${types} distinct type(s), last activity ${Math.round(daysSinceLast)} day(s) ago.`,
    activityHash,
    timestamp: now,
    expectedHarvestValue,
  };
}