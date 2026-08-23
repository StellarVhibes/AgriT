"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useReducer, useRef } from "react";
import { walletReducer, initialWalletState, WalletState } from "./walletReducer";
import { connectFreighter, getFreighterAddress, FreighterNotInstalledError, FreighterAccessDeniedError } from "./freighter";
import { fetchXlmBalance } from "./horizon";

const STORAGE_KEY = "agritrust.wallet.connected";

interface WalletContextValue extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(walletReducer, initialWalletState);
  const publicKeyRef = useRef<string | null>(null);
  useEffect(() => {
    publicKeyRef.current = state.publicKey;
  }, [state.publicKey]);

  const loadBalance = useCallback(async (publicKey: string) => {
    dispatch({ type: "BALANCE_LOADING" });
    try {
      const balance = await fetchXlmBalance(publicKey);
      dispatch({ type: "BALANCE_SUCCESS", balance });
    } catch {
      dispatch({ type: "BALANCE_ERROR", error: "Could not fetch balance" });
    }
  }, []);

  const connect = useCallback(async () => {
    dispatch({ type: "CONNECT_START" });
    try {
      const address = await connectFreighter();
      dispatch({ type: "CONNECT_SUCCESS", publicKey: address });
      window.localStorage.setItem(STORAGE_KEY, "1");
      await loadBalance(address);
    } catch (err) {
      let message = "Failed to connect to Freighter";
      if (err instanceof FreighterNotInstalledError) {
        message = "Freighter wallet is not installed. Install it from freighter.app to continue.";
      } else if (err instanceof FreighterAccessDeniedError) {
        message = "Wallet connection was rejected.";
      }
      dispatch({ type: "CONNECT_ERROR", error: message });
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [loadBalance]);

  const disconnect = useCallback(() => {
    dispatch({ type: "DISCONNECT" });
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const refreshBalance = useCallback(async () => {
    if (publicKeyRef.current) {
      await loadBalance(publicKeyRef.current);
    }
  }, [loadBalance]);

  useEffect(() => {
    const wasConnected = window.localStorage.getItem(STORAGE_KEY) === "1";
    if (!wasConnected) return;

    (async () => {
      const address = await getFreighterAddress();
      if (address) {
        dispatch({ type: "CONNECT_SUCCESS", publicKey: address });
        await loadBalance(address);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    })();
  }, [loadBalance]);

  return (
    <WalletContext.Provider value={{ ...state, connect, disconnect, refreshBalance }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return ctx;
}
