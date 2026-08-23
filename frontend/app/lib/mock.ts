export type VycStatus = "Active" | "Redeemed" | "Expired" | "Cancelled";

export interface VycRecord {
  id: number;
  farmer: string;
  score: number;
  expectedYield: number;
  crop: string;
  region: string;
  activityHash: string;
  status: VycStatus;
  createdAt: number;
  updatedAt: number;
}

export const SAMPLE_FARMER = "GCPUBA6Y7GZBC5E4VSU7CTHNWN3WQ4FM47R3FM4RH2AWUBAKJ2NBVKX4";

export const MOCK_VYCS: VycRecord[] = [
  {
    id: 8,
    farmer: SAMPLE_FARMER,
    score: 82,
    expectedYield: 45000000,
    crop: "MAIZE",
    region: "NG-OYO",
    activityHash: "9f2c41d1e8b71a0c66e3d2f9b84a1c07e5d6a3b8c42e9f1a7d0c5b6a8e3f2d91",
    status: "Active",
    createdAt: 1755110400,
    updatedAt: 1755110400,
  },
  {
    id: 7,
    farmer: SAMPLE_FARMER,
    score: 74,
    expectedYield: 32000000,
    crop: "COCOA",
    region: "NG-ON",
    activityHash: "1f8e3d2c9b4a7e6f0d5c2b8a1e9f3d6c4a7b2e8f0d1c5a9b3e7f4c2d6b8a1e0f",
    status: "Redeemed",
    createdAt: 1754502000,
    updatedAt: 1754600000,
  },
  {
    id: 6,
    farmer: SAMPLE_FARMER,
    score: 61,
    expectedYield: 28000000,
    crop: "SOYBEAN",
    region: "NG-KW",
    activityHash: "aef3b8c1d2e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1",
    status: "Active",
    createdAt: 1753899600,
    updatedAt: 1753899600,
  },
  {
    id: 5,
    farmer: SAMPLE_FARMER,
    score: 46,
    expectedYield: 15000000,
    crop: "RICE",
    region: "NG-EB",
    activityHash: "0f2d4e6c8a1b3d5f7h9j2l4n6p8r0t2v4x6z9b1d3f5h7j9l2n4p6r8t0v2x4",
    status: "Expired",
    createdAt: 1753300000,
    updatedAt: 1753900000,
  },
];

export function formatYield(microUsdc: number): string {
  return `$${(microUsdc / 1_000_000).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function formatDate(unixSeconds: number | bigint): string {
  const seconds = typeof unixSeconds === 'bigint' ? Number(unixSeconds) : unixSeconds;
  return new Date(seconds * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-6)}`;
}

export const FACTOR_LABELS: Record<string, string> = {
  base: "Base trust",
  consistency: "Flow stability",
  recency: "Activity freshness",
  volume: "Transaction volume",
  diversity: "Counterparty diversity",
};