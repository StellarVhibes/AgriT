import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchXlmBalance } from "./horizon";

describe("fetchXlmBalance", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the native XLM balance from Horizon", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          balances: [
            { asset_type: "credit_alphanum4", balance: "5.0000000" },
            { asset_type: "native", balance: "42.1234567" },
          ],
        }),
      })
    );

    const balance = await fetchXlmBalance("GABC123");
    expect(balance).toBe("42.1234567");
  });

  it("returns 0 for an unfunded (404) account", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));

    const balance = await fetchXlmBalance("GUNFUNDED");
    expect(balance).toBe("0");
  });

  it("throws on unexpected Horizon errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    await expect(fetchXlmBalance("GABC123")).rejects.toThrow();
  });
});
