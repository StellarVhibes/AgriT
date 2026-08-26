"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { AgriTrustEvent, EventStreamStatus, isEventRelevantToWallet, SorobanEventStream } from "../services/events";
import { SOROBAN_CONFIG } from "../services/soroban";

export function useContractEvents(walletAddress: string | null, onStateSync: () => void) {
  const [events, setEvents] = useState<AgriTrustEvent[]>([]);
  const [status, setStatus] = useState<EventStreamStatus>("idle");
  const [error, setError] = useState<string>();
  const [unread, setUnread] = useState(0);
  const sync = useEffectEvent(onStateSync);

  useEffect(() => {
    const stream = new SorobanEventStream({
      contractId: SOROBAN_CONFIG.CONTRACT_ID,
      onEvents: (incoming) => {
        setEvents((current) => [...incoming, ...current].slice(0, 25));
        setUnread((count) => count + incoming.length);
        if (incoming.some((event) => isEventRelevantToWallet(event, walletAddress))) sync();
      },
      onStatus: (nextStatus, message) => {
        setStatus(nextStatus);
        setError(message);
      },
    });
    stream.start();
    return () => stream.stop();
  }, [walletAddress]);

  return { events, status, error, unread, markRead: () => setUnread(0) };
}
