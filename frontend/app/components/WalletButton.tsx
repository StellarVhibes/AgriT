"use client";

import { useWallet } from "../lib/wallet/WalletContext";
import { shortAddress } from "../lib/mock";

function formatXlm(balance: string): string {
  const value = Number(balance);
  if (Number.isNaN(value)) return balance;
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 2 })} XLM`;
}

export function WalletButton() {
  const { status, publicKey, balance, isLoadingBalance, error, connect, disconnect } = useWallet();

  if (status === "connected" && publicKey) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden rounded-lg bg-muted px-3 py-2 text-xs font-medium text-muted-foreground sm:inline-block">
          {isLoadingBalance ? "Loading balance…" : balance !== null ? formatXlm(balance) : "—"}
        </span>
        <button
          onClick={disconnect}
          className="rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
          title={publicKey}
        >
          {shortAddress(publicKey)}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={connect}
        disabled={status === "connecting"}
        className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-60"
      >
        {status === "connecting" ? "Connecting…" : "Connect Wallet"}
      </button>
      {status === "error" && error && (
        <span className="max-w-[220px] text-right text-xs text-red-500">{error}</span>
      )}
    </div>
  );
}
