import { describe, expect, it } from 'vitest';
import { computeAgriTrustScore, hashActivityPayload } from './scoring.service.js';
import type { ActivityEntry } from '../types/vyc.types.js';

const NOW = 1_700_000_000;

const activeFarming: ActivityEntry[] = [
  { type: 'seed_purchase', amount: 40, timestamp: NOW - 90 * 86400, region: 'NG-LA' },
  { type: 'planting', amount: 20, timestamp: NOW - 60 * 86400, region: 'NG-LA' },
  { type: 'farm_log', amount: 10, timestamp: NOW - 30 * 86400, region: 'NG-LA' },
  { type: 'harvest_log', amount: 30, timestamp: NOW - 2 * 86400, region: 'NG-LA' },
];

describe('computeAgriTrustScore', () => {
  it('is deterministic and always within 0-100', () => {
    const a = computeAgriTrustScore(activeFarming, { now: NOW });
    const b = computeAgriTrustScore(activeFarming, { now: NOW });
    expect(a.score).toBe(b.score);
    expect(a.label === 'low' || a.label === 'medium' || a.label === 'high').toBe(true);
    expect(a.score).toBeGreaterThanOrEqual(0);
    expect(a.score).toBeLessThanOrEqual(100);
    for (const value of Object.values(a.factors)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
    expect(a.expectedHarvestValue).toBeGreaterThanOrEqual(0);
  });

  it('scores consistent, recent, diverse activity higher than a single stale event', () => {
    const rich = [...activeFarming, { type: 'sales', amount: 80, timestamp: NOW - 1 * 86400 }] as ActivityEntry[];
    const poor = [{ type: 'seed_purchase', amount: 5, timestamp: NOW - 179 * 86400, region: 'NG-LA' }];
    expect(computeAgriTrustScore(rich, { now: NOW }).score).toBeGreaterThan(
      computeAgriTrustScore(poor, { now: NOW }).score
    );
  });

  it('returns a low score for no valid activity', () => {
    const res = computeAgriTrustScore([], { now: NOW });
    expect(res.score).toBe(0);
    expect(res.label).toBe('low');
    expect(res.explanation.length).toBeGreaterThan(0);
    expect(res.expectedHarvestValue).toBe(0);
  });

  it('ignores activity outside the 180-day window', () => {
    const stale = [{ type: 'seed_purchase', amount: 40, timestamp: NOW - 200 * 86400, region: 'NG-LA' }];
    expect(computeAgriTrustScore(stale, { now: NOW }).score).toBe(0);
  });

  it('computes expectedHarvestValue from harvest_log amounts', () => {
    const events: ActivityEntry[] = [
      { type: 'harvest_log', amount: 120, timestamp: NOW - 10 * 86400, region: 'NG-LA' },
      { type: 'harvest_log', amount: 80, timestamp: NOW - 5 * 86400, region: 'NG-LA' },
    ];
    const res = computeAgriTrustScore(events, { now: NOW });
    expect(res.expectedHarvestValue).toBe(200);
  });

  it('estimates expectedHarvestValue from planting when no harvest_log present', () => {
    const events: ActivityEntry[] = [
      { type: 'planting', amount: 100, timestamp: NOW - 30 * 86400, region: 'NG-LA' },
      { type: 'farm_log', amount: 10, timestamp: NOW - 15 * 86400, region: 'NG-LA' },
    ];
    const res = computeAgriTrustScore(events, { now: NOW });
    expect(res.expectedHarvestValue).toBe(150);
  });

  it('returns 0 expectedHarvestValue when neither harvest_log nor planting present', () => {
    const events: ActivityEntry[] = [
      { type: 'seed_purchase', amount: 50, timestamp: NOW - 10 * 86400, region: 'NG-LA' },
      { type: 'sales', amount: 200, timestamp: NOW - 2 * 86400, region: 'NG-LA' },
    ];
    const res = computeAgriTrustScore(events, { now: NOW });
    expect(res.expectedHarvestValue).toBe(0);
  });
});

describe('hashActivityPayload', () => {
  it('produces a 64-char hex SHA-256, deterministically', () => {
    const first = hashActivityPayload({ proof: 'receipt-123', anchor: 'anchor-x' });
    const second = hashActivityPayload({ proof: 'receipt-123', anchor: 'anchor-x' });
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(first).toBe(second);
  });

  it('hashes a plain string payload too', () => {
    const hash = hashActivityPayload('receipt-123:anchor-x');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});