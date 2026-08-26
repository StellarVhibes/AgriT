"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Loader2 } from "lucide-react";
import { Card, CardHeader } from "../components/ui/Card";
import { ScoreRing, StatusBadge } from "../components/ui/Badges";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { MOCK_VYCS, SAMPLE_FARMER, formatDate, formatYield, shortAddress } from "../lib/mock";
import { getFarmerVycs, getVyc, VycRecord as SorobanVycRecord } from "../services/soroban";
import { ActivityFeed } from "../components/ActivityFeed";
import { useContractEvents } from "../hooks/useContractEvents";
import { useWallet } from "../lib/wallet/WalletContext";

export default function Dashboard() {
  const { publicKey: address, status, connect, refreshBalance } = useWallet();
  const isConnected = status === "connected";
  const [vycs, setVycs] = useState<typeof MOCK_VYCS>(MOCK_VYCS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const activity = useContractEvents(address, () => {
    setRefreshToken((value) => value + 1);
    void refreshBalance();
  });

  // Fetch real VYCs when wallet is connected
  useEffect(() => {
    async function fetchVycs() {
      if (!isConnected || !address) {
        // Use mock data when not connected
        setVycs(MOCK_VYCS);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Get all VYC IDs for this farmer
        const vycIds = await getFarmerVycs(address);

        if (vycIds.length === 0) {
          setVycs([]);
          setIsLoading(false);
          return;
        }

        // Fetch each VYC record
        const vycPromises = vycIds.map((id) => getVyc(id));
        const results = await Promise.all(vycPromises);

        // Filter successful results and transform to match UI format
        const fetchedVycs = results
          .filter((r) => r.success && r.data)
          .map((r) => {
            const data = r.data as SorobanVycRecord;
            return {
              id: parseInt(data.id),
              farmer: data.farmer,
              score: data.score,
              expectedYield: parseInt(data.expectedYield),
              crop: data.crop,
              region: data.region,
              activityHash: data.activityHash,
              status: data.status,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
            };
          });

        setVycs(fetchedVycs.length > 0 ? fetchedVycs : MOCK_VYCS);
      } catch (err) {
        console.error("Error fetching VYCs:", err);
        setError(err instanceof Error ? err.message : "Failed to load certificates");
        // Fallback to mock data on error
        setVycs(MOCK_VYCS);
      } finally {
        setIsLoading(false);
      }
    }

    fetchVycs();
  }, [isConnected, address, refreshToken]);

  const active = vycs.filter((v) => v.status === "Active");
  const activeValue = active.reduce((sum, v) => sum + v.expectedYield, 0);
  const best = vycs.length > 0 ? Math.max(...vycs.map((v) => v.score)) : 0;
  const lifetimeCertificates = vycs.length;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Farmer Dashboard</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isConnected && address ? (
                <>
                  Wallet <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{shortAddress(address)}</code> ·
                  {vycs === MOCK_VYCS ? " showing demo data" : " live on-chain data"}
                </>
              ) : (
                <>
                  Wallet <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{shortAddress(SAMPLE_FARMER)}</code> ·
                  demo data — connect wallet for live certificates
                </>
              )}
            </p>
            {error && (
              <p className="mt-2 text-sm text-destructive">{error}</p>
            )}
          </div>
          <div className="flex gap-3">
            {!isConnected && (
              <button
                onClick={connect}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted"
              >
                Connect Wallet
              </button>
            )}
            <Link
              href="/mint"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Mint VYC
            </Link>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <p className="text-sm text-muted-foreground">Best trust score</p>
            <p className="mt-1 text-3xl font-bold text-primary">{best}</p>
            <p className="text-xs text-muted-foreground">/100</p>
          </Card>
          <Card>
            <p className="text-sm text-muted-foreground">Active certificates</p>
            <p className="mt-1 text-3xl font-bold">{active.length}</p>
            <p className="text-xs text-muted-foreground">of {lifetimeCertificates} lifetime VYCs</p>
          </Card>
          <Card>
            <p className="text-sm text-muted-foreground">Active financed value</p>
            <p className="mt-1 text-3xl font-bold">{formatYield(activeValue)}</p>
            <p className="text-xs text-muted-foreground">across all active VYCs</p>
          </Card>
          <Card>
            <p className="text-sm text-muted-foreground">Repayment standing</p>
            <p className="mt-1 text-3xl font-bold text-emerald-600">Good</p>
            <p className="text-xs text-muted-foreground">no defaults on record</p>
          </Card>
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
          <Card className="p-0">
            <div className="p-6 pb-0">
              <CardHeader
                title="Verifiable Yield Certificates"
                subtitle="Minted against hash-locked proof-of-activity"
              />
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : vycs.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-muted-foreground mb-4">No certificates minted yet</p>
                <Link
                  href="/mint"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <Plus className="h-4 w-4" />
                  Mint Your First VYC
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {vycs.map((vyc) => (
                <div
                  key={vyc.id}
                  className="flex flex-wrap items-center gap-4 px-6 py-4"
                >
                  <ScoreRing score={vyc.score} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      VYC #{vyc.id} · {vyc.crop}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {vyc.region} · expected yield {formatYield(vyc.expectedYield)} · minted{" "}
                      {formatDate(vyc.createdAt)}
                    </p>
                    <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                      {vyc.activityHash}
                    </p>
                  </div>
                  <StatusBadge status={vyc.status} />
                </div>
              ))}
              </div>
            )}
          </Card>

          <div className="space-y-6">
            <ActivityFeed {...activity} onMarkRead={activity.markRead} />
            <Card>
              <CardHeader
                title="Current trust position"
                subtitle="Latest scored behavior"
              />
              <div className="flex items-center gap-4">
                <ScoreRing score={82} />
                <div>
                  <p className="font-semibold">High trust</p>
                  <p className="text-sm text-muted-foreground">
                    Consistent season-to-season activity across 5 factor groups.
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader
                title="What would strengthen this"
                subtitle="Engine suggestions"
              />
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary">—</span>
                  Hold 3+ months of continuous sales activity to raise the volume factor.
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">—</span>
                  Trade with more counterparties to improve diversity.
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">—</span>
                  Keep harvest logs updated promptly for best recency credit.
                </li>
              </ul>
            </Card>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
