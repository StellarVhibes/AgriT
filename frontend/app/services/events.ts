"use client";

import { rpc, scValToNative } from "@stellar/stellar-sdk";
import { getSorobanServer } from "./soroban";

const PAGE_SIZE = 100;
const MAX_RETRY_DELAY = 30_000;

export type AgriTrustEventKind = "vyc_minted" | "vyc_status" | "insurance_triggered" | "payout_initiated";

export interface AgriTrustEvent {
  id: string;
  kind: AgriTrustEventKind;
  ledger: number;
  ledgerClosedAt: string;
  txHash: string;
  subject?: string;
  details: string;
}

export interface EventSource {
  getLatestLedger: () => Promise<{ sequence: number }>;
  getEvents: (request: rpc.Api.GetEventsRequest) => Promise<rpc.Api.GetEventsResponse>;
}

export interface EventStreamOptions {
  contractId: string;
  source?: EventSource;
  onEvents: (events: AgriTrustEvent[]) => void;
  onStatus: (status: EventStreamStatus, error?: string) => void;
}

export type EventStreamStatus = "idle" | "connecting" | "connected" | "reconnecting" | "error";

type NativeEvent = Omit<AgriTrustEvent, "kind" | "subject" | "details"> & {
  topic: unknown[];
  value: unknown;
};

function eventDetails(kind: AgriTrustEventKind, value: unknown): string {
  const values = Array.isArray(value) ? value : [];
  if (kind === "vyc_minted") return `VYC #${values[0] ?? "new"} was minted`;
  if (kind === "vyc_status") return `VYC status changed to ${values[0] ?? "updated"}`;
  if (kind === "insurance_triggered") return "Insurance protection was triggered";
  return "Payout was initiated";
}

export function parseAgriTrustEvent(event: NativeEvent): AgriTrustEvent | null {
  const topic = String(event.topic[0] ?? "").toLowerCase();
  const kind = topic as AgriTrustEventKind;
  if (!(["vyc_minted", "vyc_status", "insurance_triggered", "payout_initiated"] as string[]).includes(kind)) {
    return null;
  }

  const subject = typeof event.topic[1] === "string" ? event.topic[1] : undefined;
  return { ...event, kind, subject, details: eventDetails(kind, event.value) };
}

export function isEventRelevantToWallet(event: AgriTrustEvent, walletAddress: string | null): boolean {
  return Boolean(walletAddress && (!event.subject || event.subject === walletAddress));
}

export class SorobanEventStream {
  private cursor: string | null = null;
  private stopped = false;
  private retryDelay = 1_000;
  private seenIds = new Set<string>();
  private timeout: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly options: EventStreamOptions) {}

  start() {
    if (!this.options.contractId) {
      this.options.onStatus("idle", "Set NEXT_PUBLIC_VYC_CONTRACT_ID to start the activity feed.");
      return;
    }
    this.stopped = false;
    void this.read();
  }

  stop() {
    this.stopped = true;
    if (this.timeout) clearTimeout(this.timeout);
  }

  private schedule(delay: number) {
    if (!this.stopped) this.timeout = setTimeout(() => void this.read(), delay);
  }

  private async read() {
    const { contractId, onEvents, onStatus } = this.options;
    const source = this.options.source ?? getSorobanServer();
    onStatus(this.cursor ? "connected" : "connecting");

    try {
      const request = this.cursor
        ? { filters: [{ type: "contract" as const, contractIds: [contractId] }], cursor: this.cursor, limit: PAGE_SIZE }
        : {
            filters: [{ type: "contract" as const, contractIds: [contractId] }],
            startLedger: (await source.getLatestLedger()).sequence,
            limit: PAGE_SIZE,
          };
      const response = await source.getEvents(request);
      if (this.stopped) return;
      this.cursor = response.cursor;
      this.retryDelay = 1_000;
      const events = response.events
        .map((event) => parseAgriTrustEvent({
          id: event.id,
          ledger: event.ledger,
          ledgerClosedAt: event.ledgerClosedAt,
          txHash: event.txHash,
          topic: event.topic.map(scValToNative),
          value: scValToNative(event.value),
        }))
        .filter((event): event is AgriTrustEvent => event !== null && !this.seenIds.has(event.id));
      events.forEach((event) => this.seenIds.add(event.id));
      while (this.seenIds.size > 500) this.seenIds.delete(this.seenIds.values().next().value!);
      if (events.length) onEvents(events);
      onStatus("connected");
      this.schedule(1_000);
    } catch (error) {
      if (this.stopped) return;
      const message = error instanceof Error ? error.message : "Unable to reach Soroban event stream";
      onStatus("error", `${message}. Retrying in ${Math.ceil(this.retryDelay / 1000)}s.`);
      this.schedule(this.retryDelay);
      this.retryDelay = Math.min(this.retryDelay * 2, MAX_RETRY_DELAY);
    }
  }
}
