"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Loader2, Sprout, Shield, TrendingUp, ChevronRight } from "lucide-react";
import { Card, CardHeader } from "../components/ui/Card";
import { ScoreRing, StatusBadge } from "../components/ui/Badges";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { MOCK_VYCS, SAMPLE_FARMER, formatDate, formatYield, shortAddress } from "../lib/mock";
import { getFarmerVycs, getVyc, VycRecord as SorobanVycRecord } from "../services/soroban";
import { ActivityFeed } from "../components/ActivityFeed";
import { useContractEvents } from "../hooks/useContractEvents";
import { useWallet } from "../lib/wallet/WalletContext";
import { Reveal, StaggerReveal, FloatingImage } from "../components/motion/Reveal";

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

  useEffect(() => {
    async function fetchVycs() {
      if (!isConnected || !address) {
        setVycs(MOCK_VYCS);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const vycIds = await getFarmerVycs(address);

        if (vycIds.length === 0) {
          setVycs([]);
          setIsLoading(false);
          return;
        }

        const vycPromises = vycIds.map((id) => getVyc(id));
        const results = await Promise.all(vycPromises);

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
      <main className="relative mx-auto max-w-6xl px-4 sm:px-6 py-10">
        {/* Background pattern */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: "url(/assets/abstract-background/pattern_bridge_network.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        <div className="relative">
          {/* Header */}
          <Reveal>
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="hidden sm:block">
                  <FloatingImage
                    src="/assets/feature-section-3d-imgs/feature_vyc_certificate.png"
                    alt="VYC certificate"
                    className="h-16 w-16 object-contain"
                    duration={7}
                    distance={4}
                  />
                </div>
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
          </Reveal>

          {/* Stats cards */}
          <StaggerReveal className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          </StaggerReveal>

          {/* Main content */}
          <section className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
            {/* VYC table */}
            <Reveal direction="left" delay={0.1}>
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
                      <Link
                        key={vyc.id}
                        href={`/certificates/${vyc.id}`}
                        className="group flex flex-wrap items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/40 cursor-pointer block"
                      >
                        <ScoreRing score={vyc.score} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              VYC #{vyc.id} · {vyc.crop}
                            </p>
                            <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                              View details →
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {vyc.region} · expected yield {formatYield(vyc.expectedYield)} · minted{" "}
                            {formatDate(vyc.createdAt)}
                          </p>
                          <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                            {vyc.activityHash}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={vyc.status} />
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </Card>
            </Reveal>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Welcome / next action */}
              <Reveal direction="right" delay={0.12}>
                <Card className="border-primary/20 bg-primary/5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Sprout className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Good morning</p>
                      <p className="font-semibold">Ready to log activity?</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Recording this season&apos;s planting helps maintain your trust score.
                      </p>
                      <Link
                        href="/mint"
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                      >
                        Log planting activity →
                      </Link>
                    </div>
                  </div>
                </Card>
              </Reveal>

              <Reveal direction="right" delay={0.15}>
                <ActivityFeed {...activity} onMarkRead={activity.markRead} />
              </Reveal>

              {/* Insurance card */}
              <Reveal direction="right" delay={0.18}>
                <Card>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <CardHeader
                        title="Crop Insurance"
                        subtitle="Parametric coverage"
                      />
                      <div className="mt-2 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                        <span className="text-xs text-muted-foreground">Season 2026</span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Weather-triggered payout for drought and flood events. Coverage tied to your VYC status.
                      </p>
                    </div>
                  </div>
                </Card>
              </Reveal>

              {/* Financing card */}
              <Reveal direction="right" delay={0.2}>
                <Card>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <CardHeader
                        title="Financing"
                        subtitle="Eligible liquidity"
                      />
                      <div className="mt-2">
                        <p className="text-2xl font-bold">$12,400</p>
                        <p className="text-xs text-muted-foreground">estimated eligible amount</p>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Based on your active VYCs and repayment history. Lenders can fund against your certificates.
                      </p>
                      <Link
                        href="/score"
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                      >
                        View score details →
                      </Link>
                    </div>
                  </div>
                </Card>
              </Reveal>

              <Reveal direction="right" delay={0.22}>
                <Card>
                  <div className="flex items-start gap-4">
                    <FloatingImage
                      src="/assets/feature-section-3d-imgs/feature_credit_scoring.png"
                      alt="Credit scoring"
                      className="h-20 w-20 object-contain"
                      duration={8}
                      distance={5}
                    />
                    <div className="flex-1">
                      <CardHeader
                        title="Current trust position"
                        subtitle="Latest scored behavior"
                      />
                      <div className="flex items-center gap-4 mt-2">
                        <ScoreRing score={82} />
                        <div>
                          <p className="font-semibold">High trust</p>
                          <p className="text-sm text-muted-foreground">
                            Consistent season-to-season activity across 5 factor groups.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Reveal>

              <Reveal direction="right" delay={0.25}>
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
              </Reveal>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
