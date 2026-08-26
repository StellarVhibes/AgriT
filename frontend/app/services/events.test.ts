import { describe, expect, it, vi } from "vitest";
import { isEventRelevantToWallet, parseAgriTrustEvent, SorobanEventStream } from "./events";

describe("parseAgriTrustEvent", () => {
  it("normalizes a VYC mint event", () => {
    expect(parseAgriTrustEvent({
      id: "event-1", ledger: 12, ledgerClosedAt: "2026-01-01T00:00:00Z", txHash: "abc",
      topic: ["vyc_minted", "GFARMER"], value: [7, 88],
    })).toMatchObject({ kind: "vyc_minted", subject: "GFARMER", details: "VYC #7 was minted" });
  });

  it("ignores events outside AgriTrust's supported activity types", () => {
    expect(parseAgriTrustEvent({
      id: "event-1", ledger: 12, ledgerClosedAt: "", txHash: "abc", topic: ["unrelated"], value: [],
    })).toBeNull();
  });

  it("only syncs a wallet for its event or a contract-wide status event", () => {
    const wallet = "GFARMER";
    const ownEvent = parseAgriTrustEvent({ id: "1", ledger: 1, ledgerClosedAt: "", txHash: "", topic: ["vyc_minted", wallet], value: [] })!;
    const statusEvent = parseAgriTrustEvent({ id: "2", ledger: 1, ledgerClosedAt: "", txHash: "", topic: ["vyc_status", 4], value: [] })!;
    expect(isEventRelevantToWallet(ownEvent, wallet)).toBe(true);
    expect(isEventRelevantToWallet(ownEvent, "GOTHER")).toBe(false);
    expect(isEventRelevantToWallet(statusEvent, wallet)).toBe(true);
  });
});

describe("SorobanEventStream", () => {
  it("uses its cursor and does not emit duplicate events after reconnecting", async () => {
    vi.useFakeTimers();
    const getEvents = vi.fn()
      .mockResolvedValueOnce({ events: [], cursor: "first" })
      .mockResolvedValueOnce({ events: [], cursor: "second" });
    const stream = new SorobanEventStream({
      contractId: "C123",
      source: { getLatestLedger: vi.fn().mockResolvedValue({ sequence: 100 }), getEvents },
      onEvents: vi.fn(), onStatus: vi.fn(),
    });
    stream.start();
    await vi.waitFor(() => expect(getEvents).toHaveBeenCalledTimes(1));
    await vi.advanceTimersByTimeAsync(1_000);
    stream.stop();
    expect(getEvents.mock.calls[0][0]).toMatchObject({ startLedger: 100, filters: [{ contractIds: ["C123"] }] });
    expect(getEvents.mock.calls[1][0]).toMatchObject({ cursor: "first" });
    vi.useRealTimers();
  });
});
