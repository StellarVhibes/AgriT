import { describe, it, expect } from "vitest";
import {
  mapVycStatus,
  isValidVycId,
  getLifecycleStageInfo,
  formatMicroUsdc,
  formatVycDate,
  isValidActivityHash,
  generateActivityEventsForVyc,
  VycLifecycleStatus,
} from "../lib/vyc";

describe("VYC Status Mapping Logic", () => {
  it("should correctly map numeric on-chain enum codes", () => {
    expect(mapVycStatus(0)).toBe("Active");
    expect(mapVycStatus(1)).toBe("Redeemed");
    expect(mapVycStatus(2)).toBe("Expired");
    expect(mapVycStatus(3)).toBe("Cancelled");
  });

  it("should correctly map string numeric enum representations", () => {
    expect(mapVycStatus("0")).toBe("Active");
    expect(mapVycStatus("1")).toBe("Redeemed");
    expect(mapVycStatus("2")).toBe("Expired");
    expect(mapVycStatus("3")).toBe("Cancelled");
  });

  it("should correctly map case-insensitive textual status names", () => {
    expect(mapVycStatus("Active")).toBe("Active");
    expect(mapVycStatus("active")).toBe("Active");
    expect(mapVycStatus("ACTIVE")).toBe("Active");

    expect(mapVycStatus("Redeemed")).toBe("Redeemed");
    expect(mapVycStatus("redeemed")).toBe("Redeemed");

    expect(mapVycStatus("Expired")).toBe("Expired");
    expect(mapVycStatus("expired")).toBe("Expired");

    expect(mapVycStatus("Cancelled")).toBe("Cancelled");
    expect(mapVycStatus("cancelled")).toBe("Cancelled");
    expect(mapVycStatus("canceled")).toBe("Cancelled");
  });

  it("should fallback gracefully to Active for null, undefined, or unknown values", () => {
    expect(mapVycStatus(null)).toBe("Active");
    expect(mapVycStatus(undefined)).toBe("Active");
    expect(mapVycStatus("unknown_status")).toBe("Active");
    expect(mapVycStatus(99)).toBe("Active");
  });
});

describe("VYC Lifecycle Stage and Transition Validation", () => {
  it("should define valid transition pathways from Active state", () => {
    const activeInfo = getLifecycleStageInfo("Active");
    expect(activeInfo.isTerminal).toBe(false);
    expect(activeInfo.allowedTransitions).toContain("Redeemed");
    expect(activeInfo.allowedTransitions).toContain("Expired");
    expect(activeInfo.allowedTransitions).toContain("Cancelled");
    expect(activeInfo.allowedTransitions.length).toBe(3);
  });

  it("should treat Redeemed, Expired, and Cancelled as terminal states", () => {
    const redeemedInfo = getLifecycleStageInfo("Redeemed");
    expect(redeemedInfo.isTerminal).toBe(true);
    expect(redeemedInfo.allowedTransitions.length).toBe(0);

    const expiredInfo = getLifecycleStageInfo("Expired");
    expect(expiredInfo.isTerminal).toBe(true);
    expect(expiredInfo.allowedTransitions.length).toBe(0);

    const cancelledInfo = getLifecycleStageInfo("Cancelled");
    expect(cancelledInfo.isTerminal).toBe(true);
    expect(cancelledInfo.allowedTransitions.length).toBe(0);
  });

  it("should provide meaningful investor and cooperative explanations for each state", () => {
    const statuses: VycLifecycleStatus[] = ["Active", "Redeemed", "Expired", "Cancelled"];
    statuses.forEach((status) => {
      const info = getLifecycleStageInfo(status);
      expect(info.title).toBeTruthy();
      expect(info.summary).toBeTruthy();
      expect(info.investorMeaning).toBeTruthy();
      expect(info.cooperativeMeaning).toBeTruthy();
      expect(info.badgeVariant).toBeTruthy();
    });
  });
});

describe("VYC ID Validation", () => {
  it("should accept valid positive integer IDs", () => {
    expect(isValidVycId("1")).toBe(true);
    expect(isValidVycId("8")).toBe(true);
    expect(isValidVycId("100")).toBe(true);
    expect(isValidVycId(5)).toBe(true);
  });

  it("should reject non-positive or non-integer ID values", () => {
    expect(isValidVycId("0")).toBe(false);
    expect(isValidVycId("-1")).toBe(false);
    expect(isValidVycId("abc")).toBe(false);
    expect(isValidVycId("")).toBe(false);
    expect(isValidVycId("1.5")).toBe(false);
    expect(isValidVycId("NaN")).toBe(false);
  });
});

describe("Micro-USDC & Date Formatting Helpers", () => {
  it("should correctly format 6-decimal micro-USDC to readable USD strings", () => {
    expect(formatMicroUsdc(45_000_000)).toBe("$45.00");
    expect(formatMicroUsdc(500_000)).toBe("$0.50");
    expect(formatMicroUsdc(32_500_000)).toBe("$32.50");
    expect(formatMicroUsdc(0)).toBe("$0.00");
    expect(formatMicroUsdc(BigInt(100_000_000))).toBe("$100.00");
  });

  it("should handle edge cases in micro-USDC formatting", () => {
    expect(formatMicroUsdc(-50)).toBe("$0.00");
    expect(formatMicroUsdc("invalid")).toBe("$0.00");
  });

  it("should format Unix timestamps to human readable dates", () => {
    // 1755110400 = Aug 13/14 2025 UTC
    const formatted = formatVycDate(1755110400);
    expect(formatted).toContain("2025");
    expect(formatVycDate(0)).toBe("—");
  });
});

describe("Activity Hash Validation", () => {
  it("should validate 64-character SHA-256 hexadecimal hashes", () => {
    const validHex = "9f2c41d1e8b71a0c66e3d2f9b84a1c07e5d6a3b8c42e9f1a7d0c5b6a8e3f2d91";
    expect(isValidActivityHash(validHex)).toBe(true);

    const validUppercase = "9F2C41D1E8B71A0C66E3D2F9B84A1C07E5D6A3B8C42E9F1A7D0C5B6A8E3F2D91";
    expect(isValidActivityHash(validUppercase)).toBe(true);
  });

  it("should reject invalid hash strings", () => {
    expect(isValidActivityHash("short_hash")).toBe(false);
    expect(isValidActivityHash("")).toBe(false);
    expect(isValidActivityHash("9f2c41d1e8b71a0c66e3d2f9b84a1c07e5d6a3b8c42e9f1a7d0c5b6a8e3f2d9Z")).toBe(false); // contains non-hex 'Z'
  });
});

describe("Underlying Activity Events Generator", () => {
  it("should generate comprehensive events for Active certificates", () => {
    const events = generateActivityEventsForVyc({
      id: 8,
      crop: "MAIZE",
      region: "NG-OYO",
      expectedYield: 45_000_000,
      createdAt: 1755110400,
      updatedAt: 1755110400,
      status: "Active",
      activityHash: "9f2c41d1e8b71a0c66e3d2f9b84a1c07e5d6a3b8c42e9f1a7d0c5b6a8e3f2d91",
    });

    expect(events.length).toBeGreaterThanOrEqual(4);

    const types = events.map((e) => e.type);
    expect(types).toContain("season_start");
    expect(types).toContain("planting");
    expect(types).toContain("inspection");
    expect(types).toContain("harvest");

    // Check that dates, location, and verifiedBy exist on all events
    events.forEach((event) => {
      expect(event.date).toBeTruthy();
      expect(event.title).toBeTruthy();
      expect(event.description).toBeTruthy();
      expect(event.location).toBe("NG-OYO");
      expect(event.verifiedBy).toBeTruthy();
    });
  });

  it("should include settled sale event for Redeemed certificates", () => {
    const events = generateActivityEventsForVyc({
      id: 7,
      crop: "COCOA",
      region: "NG-ON",
      expectedYield: 32_000_000,
      createdAt: 1754502000,
      updatedAt: 1754600000,
      status: "Redeemed",
      activityHash: "1f8e3d2c9b4a7e6f0d5c2b8a1e9f3d6c4a7b2e8f0d1c5a9b3e7f4c2d6b8a1e0f",
    });

    const saleEvent = events.find((e) => e.type === "sale");
    expect(saleEvent).toBeDefined();
    expect(saleEvent?.status).toBe("settled");
    expect(saleEvent?.title).toContain("Sale");
  });
});
