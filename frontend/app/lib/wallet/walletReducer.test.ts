import { describe, expect, it } from "vitest";
import { initialWalletState, walletReducer } from "./walletReducer";

describe("walletReducer", () => {
  it("starts disconnected", () => {
    expect(initialWalletState.status).toBe("disconnected");
    expect(initialWalletState.publicKey).toBeNull();
  });

  it("moves to connecting on CONNECT_START", () => {
    const state = walletReducer(initialWalletState, { type: "CONNECT_START" });
    expect(state.status).toBe("connecting");
    expect(state.error).toBeNull();
  });

  it("stores the public key on CONNECT_SUCCESS", () => {
    const connecting = walletReducer(initialWalletState, { type: "CONNECT_START" });
    const connected = walletReducer(connecting, {
      type: "CONNECT_SUCCESS",
      publicKey: "GABC123",
    });
    expect(connected.status).toBe("connected");
    expect(connected.publicKey).toBe("GABC123");
  });

  it("captures an error message and clears account state on CONNECT_ERROR", () => {
    const connecting = walletReducer(initialWalletState, { type: "CONNECT_START" });
    const errored = walletReducer(connecting, {
      type: "CONNECT_ERROR",
      error: "Freighter is not installed",
    });
    expect(errored.status).toBe("error");
    expect(errored.publicKey).toBeNull();
    expect(errored.error).toBe("Freighter is not installed");
  });

  it("resets to the initial state on DISCONNECT", () => {
    const connected = walletReducer(initialWalletState, {
      type: "CONNECT_SUCCESS",
      publicKey: "GABC123",
    });
    const disconnected = walletReducer(connected, { type: "DISCONNECT" });
    expect(disconnected).toEqual(initialWalletState);
  });

  it("tracks balance loading and success", () => {
    const loading = walletReducer(initialWalletState, { type: "BALANCE_LOADING" });
    expect(loading.isLoadingBalance).toBe(true);

    const loaded = walletReducer(loading, { type: "BALANCE_SUCCESS", balance: "100.5000000" });
    expect(loaded.isLoadingBalance).toBe(false);
    expect(loaded.balance).toBe("100.5000000");
  });

  it("clears balance on BALANCE_ERROR without touching connection status", () => {
    const connected = walletReducer(initialWalletState, {
      type: "CONNECT_SUCCESS",
      publicKey: "GABC123",
    });
    const errored = walletReducer(connected, { type: "BALANCE_ERROR", error: "network down" });
    expect(errored.status).toBe("connected");
    expect(errored.balance).toBeNull();
    expect(errored.isLoadingBalance).toBe(false);
  });
});
