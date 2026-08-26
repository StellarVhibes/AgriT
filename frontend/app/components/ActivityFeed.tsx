"use client";

import { Activity, AlertTriangle, Wifi, WifiOff } from "lucide-react";
import { Card, CardHeader } from "./ui/Card";
import type { AgriTrustEvent, EventStreamStatus } from "../services/events";

export function ActivityFeed({ events, status, error, unread, onMarkRead }: {
  events: AgriTrustEvent[];
  status: EventStreamStatus;
  error?: string;
  unread: number;
  onMarkRead: () => void;
}) {
  const isOnline = status === "connected";
  return (
    <Card className="p-0">
      <div className="flex items-start justify-between p-6 pb-4">
        <CardHeader title="Activity feed" subtitle="Live contract events from Soroban testnet" />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isOnline ? <Wifi className="h-4 w-4 text-emerald-600" /> : <WifiOff className="h-4 w-4 text-amber-600" />}
          {unread > 0 && <button onClick={onMarkRead} className="rounded-full bg-primary px-2 py-0.5 font-semibold text-primary-foreground" aria-label="Mark activity feed as read">{unread}</button>}
        </div>
      </div>
      {error && <p className="mx-6 mb-4 flex gap-2 rounded-md bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200"><AlertTriangle className="h-4 w-4 shrink-0" />{error}</p>}
      <div className="divide-y divide-border">
        {events.length === 0 ? (
          <div className="flex items-center gap-3 p-6 text-sm text-muted-foreground"><Activity className="h-5 w-5" />Waiting for contract activity...</div>
        ) : events.map((event) => (
          <div key={event.id} className="p-4">
            <p className="text-sm font-semibold capitalize">{event.kind.replaceAll("_", " ")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{event.details}</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">Ledger {event.ledger} · {event.txHash.slice(0, 10)}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
