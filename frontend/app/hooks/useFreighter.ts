"use client";

import { useState, useEffect, useCallback } from "react";
import { isConnected, requestAccess, setAllowed, getPublicKey } from "@stellar/freighter-api";

export interface UseFreighterReturn {
  address: string;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export function useFreighter(): UseFreighterReturn {
  const [address, setAddress] = useState<string>("");
  const [isConnectedState, setIsConnectedState] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check if wallet is already connected on mount
  useEffect(() => {
    async function checkConnection() {
      try {
        setIsLoading(true);
        setError(null);

        const connected = await isConnected();

        if (connected) {
          const publicKey = await getPublicKey();
          if (publicKey) {
            setAddress(publicKey);
            setIsConnectedState(true);
          }
        }
      } catch (err) {
        console.error("Error checking wallet connection:", err);
        setError("Failed to check wallet connection");
      } finally {
        setIsLoading(false);
      }
    }

    checkConnection();
  }, []);

  const connect = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if Freighter is installed
      const connected = await isConnected();
      if (!connected) {
        setError("Freighter wallet is not installed. Please install it from https://www.freighter.app/");
        setIsLoading(false);
        return;
      }

      // Request access to the wallet
      const publicKey = await requestAccess();

      if (!publicKey) {
        setError("Failed to get wallet address. Please try again.");
        setIsLoading(false);
        return;
      }

      // Grant permission
      await setAllowed();

      setAddress(publicKey);
      setIsConnectedState(true);
    } catch (err) {
      console.error("Error connecting to Freighter:", err);
      setError(err instanceof Error ? err.message : "Failed to connect to wallet. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress("");
    setIsConnectedState(false);
    setError(null);
  }, []);

  return {
    address,
    isConnected: isConnectedState,
    isLoading,
    error,
    connect,
    disconnect,
  };
}
