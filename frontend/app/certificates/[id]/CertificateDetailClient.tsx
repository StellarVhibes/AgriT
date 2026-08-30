"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Shield,
  Sprout,
  DollarSign,
  Calendar,
  Layers,
  Activity,
  FileText,
} from "lucide-react";
import { SiteHeader } from "../../components/SiteHeader";
import { SiteFooter } from "../../components/SiteFooter";
import { Card } from "../../components/ui/Card";
import { ScoreRing, StatusBadge } from "../../components/ui/Badges";
import { Reveal, StaggerReveal, FloatingImage } from "../../components/motion/Reveal";
import { MOCK_VYCS, shortAddress } from "../../lib/mock";
import {
  VycDetailRecord,
  isValidVycId,
  mapVycStatus,
  formatMicroUsdc,
  formatVycDate,
  generateActivityEventsForVyc,
} from "../../lib/vyc";
import { getVyc, SOROBAN_CONFIG } from "../../services/soroban";
import { VycLifecycleTimeline } from "./components/VycLifecycleTimeline";
import { VycActivityEvents } from "./components/VycActivityEvents";
import { CertificateNotFound } from "./components/CertificateNotFound";

interface CertificateDetailClientProps {
  id: string;
}

export function CertificateDetailClient({ id }: CertificateDetailClientProps) {
  const [vyc, setVyc] = useState<VycDetailRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [activeTab, setActiveTab] = useState<"lifecycle" | "activities" | "audit">("lifecycle");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadCertificate() {
      if (!isValidVycId(id)) {
        if (isMounted) {
          setError(`"${id}" is not a valid certificate identifier.`);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      const numericId = parseInt(id, 10);

      try {
        // 1. Attempt on-chain contract read via Soroban RPC
        const result = await getVyc(id);
        if (!isMounted) return;

        if (result.success && result.data) {
          const raw = result.data;
          const mappedStatus = mapVycStatus(raw.status);
          const expectedYieldMicro = parseInt(raw.expectedYield, 10) || 0;
          const createdAt = Number(raw.createdAt) || Math.floor(Date.now() / 1000) - 86400 * 30;
          const updatedAt = Number(raw.updatedAt) || createdAt;

          const events = generateActivityEventsForVyc({
            id: numericId,
            crop: raw.crop,
            region: raw.region,
            expectedYield: expectedYieldMicro,
            createdAt,
            updatedAt,
            status: mappedStatus,
            activityHash: raw.activityHash,
          });

          setVyc({
            id: numericId,
            farmer: raw.farmer,
            score: raw.score,
            expectedYield: expectedYieldMicro,
            crop: raw.crop,
            region: raw.region,
            activityHash: raw.activityHash,
            status: mappedStatus,
            createdAt,
            updatedAt,
            events,
            isOnChainLive: true,
          });
          setIsLoading(false);
          return;
        }

        // 2. Fallback to mock / demo data if matching mock exists (for offline development / demo)
        const mockRecord = MOCK_VYCS.find((v) => v.id === numericId);
        if (mockRecord) {
          const mappedStatus = mapVycStatus(mockRecord.status);
          const events = generateActivityEventsForVyc({
            id: mockRecord.id,
            crop: mockRecord.crop,
            region: mockRecord.region,
            expectedYield: mockRecord.expectedYield,
            createdAt: mockRecord.createdAt,
            updatedAt: mockRecord.updatedAt,
            status: mappedStatus,
            activityHash: mockRecord.activityHash,
          });

          setVyc({
            id: mockRecord.id,
            farmer: mockRecord.farmer,
            score: mockRecord.score,
            expectedYield: mockRecord.expectedYield,
            crop: mockRecord.crop,
            region: mockRecord.region,
            activityHash: mockRecord.activityHash,
            status: mappedStatus,
            createdAt: mockRecord.createdAt,
            updatedAt: mockRecord.updatedAt,
            events,
            isOnChainLive: false,
          });
          setIsLoading(false);
          return;
        }

        // 3. Not found anywhere
        setError(`Certificate #${id} was not found on the Stellar Soroban ledger.`);
        setVyc(null);
      } catch (err) {
        if (!isMounted) return;
        console.error("Error loading certificate:", err);
        const mockRecord = MOCK_VYCS.find((v) => v.id === numericId);
        if (mockRecord) {
          const mappedStatus = mapVycStatus(mockRecord.status);
          setVyc({
            id: mockRecord.id,
            farmer: mockRecord.farmer,
            score: mockRecord.score,
            expectedYield: mockRecord.expectedYield,
            crop: mockRecord.crop,
            region: mockRecord.region,
            activityHash: mockRecord.activityHash,
            status: mappedStatus,
            createdAt: mockRecord.createdAt,
            updatedAt: mockRecord.updatedAt,
            events: generateActivityEventsForVyc({
              ...mockRecord,
              status: mappedStatus,
            }),
            isOnChainLive: false,
          });
        } else {
          setError(err instanceof Error ? err.message : "Failed to load certificate");
          setVyc(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    void loadCertificate();

    return () => {
      isMounted = false;
    };
  }, [id, refreshIndex]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshIndex((prev) => prev + 1);
  };

  const copyFarmerAddress = () => {
    if (!vyc?.farmer) return;
    navigator.clipboard.writeText(vyc.farmer);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const getStellarExpertContractUrl = (): string => {
    const network = SOROBAN_CONFIG.NETWORK_PASSPHRASE.includes("Test") ? "testnet" : "public";
    return `https://stellar.expert/explorer/${network}/contract/${SOROBAN_CONFIG.CONTRACT_ID}`;
  };

  if (isLoading) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <h2 className="text-xl font-bold">Reading On-Chain VYC #{id}...</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Simulating Soroban smart contract view function and decoding cryptographic proof-of-activity
            </p>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  if (error || !vyc) {
    return (
      <>
        <SiteHeader />
        <CertificateNotFound id={id} errorDetail={error || undefined} />
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="relative mx-auto max-w-6xl px-4 sm:px-6 py-10">
        {/* Background ambient pattern */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "url(/assets/abstract-background/pattern_certificate_particles.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        <div className="relative">
          {/* Breadcrumb & Navigation bar */}
          <Reveal>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-muted disabled:opacity-50"
                  title="Re-query Soroban Contract"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                  {isRefreshing ? "Reading Ledger..." : "Refresh On-Chain"}
                </button>
              </div>
            </div>
          </Reveal>

          {/* Certificate Main Hero Card */}
          <Reveal delay={0.05}>
            <div className="mb-8 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  <FloatingImage
                    src="/assets/feature-section-3d-imgs/feature_vyc_certificate.png"
                    alt="VYC Certificate"
                    className="h-20 w-20 object-contain flex-shrink-0"
                    duration={7}
                    distance={4}
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                        VYC #{vyc.id} · {vyc.crop}
                      </h1>
                      <StatusBadge status={vyc.status} />
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          vyc.isOnChainLive
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {vyc.isOnChainLive ? "● Live On-Chain Read" : "○ Demo / Cache Mode"}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Verifiable Yield Certificate · Region <strong className="text-foreground">{vyc.region}</strong> · Minted on{" "}
                      {formatVycDate(vyc.createdAt)}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                      <span className="text-muted-foreground">Farmer Wallet:</span>
                      <code className="rounded bg-muted px-2 py-1 font-mono text-foreground">
                        {shortAddress(vyc.farmer)}
                      </code>
                      <button
                        onClick={copyFarmerAddress}
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                        title="Copy full wallet address"
                      >
                        {copiedAddress ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copiedAddress ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Score & Expected Yield Highlight Box */}
                <div className="flex items-center gap-6 self-start lg:self-center border-t lg:border-t-0 lg:border-l border-border pt-4 lg:pt-0 lg:pl-6">
                  <div className="text-left sm:text-right">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Expected Harvest Value
                    </p>
                    <p className="mt-1 text-2xl sm:text-3xl font-black text-primary">
                      {formatMicroUsdc(vyc.expectedYield)}
                    </p>
                    <p className="text-xs text-muted-foreground">micro-USDC tokenized</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <ScoreRing score={vyc.score} />
                    <span className="mt-1 text-xs font-semibold text-muted-foreground">Trust Score</span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Quick Metrics Bar */}
          <StaggerReveal className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                    Expected Yield
                  </p>
                  <p className="text-lg font-bold">{formatMicroUsdc(vyc.expectedYield)}</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Sprout className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                    Crop & Region
                  </p>
                  <p className="text-lg font-bold">{vyc.crop} · {vyc.region}</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                    Parametric Shield
                  </p>
                  <p className="text-lg font-bold text-emerald-600">Active (2026)</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                    Status Updated
                  </p>
                  <p className="text-lg font-bold">{formatVycDate(vyc.updatedAt)}</p>
                </div>
              </div>
            </Card>
          </StaggerReveal>

          {/* Interactive Section Tabs */}
          <Reveal delay={0.1}>
            <div className="mb-6 flex border-b border-border">
              <button
                onClick={() => setActiveTab("lifecycle")}
                className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
                  activeTab === "lifecycle"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Layers className="h-4 w-4" />
                VYC Lifecycle Status
              </button>
              <button
                onClick={() => setActiveTab("activities")}
                className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
                  activeTab === "activities"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Activity className="h-4 w-4" />
                Underlying Activity Events ({vyc.events?.length ?? 0})
              </button>
              <button
                onClick={() => setActiveTab("audit")}
                className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
                  activeTab === "audit"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="h-4 w-4" />
                On-Chain Audit & Contract Specs
              </button>
            </div>
          </Reveal>

          {/* Tab 1: Lifecycle Timeline */}
          {activeTab === "lifecycle" && (
            <VycLifecycleTimeline
              status={vyc.status}
              createdAt={vyc.createdAt}
              updatedAt={vyc.updatedAt}
              vycId={vyc.id}
            />
          )}

          {/* Tab 2: Activity Events */}
          {activeTab === "activities" && (
            <VycActivityEvents
              events={vyc.events || []}
              activityHash={vyc.activityHash}
              crop={vyc.crop}
              region={vyc.region}
            />
          )}

          {/* Tab 3: Contract & Audit Details */}
          {activeTab === "audit" && (
            <Reveal>
              <Card className="border border-border bg-card p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-bold">Soroban Smart Contract Audit Reference</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Technical verification data for investors, anchor verifiers, and cooperative nodes.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Contract Function Called
                    </p>
                    <code className="mt-1 block text-sm font-mono font-bold text-foreground">
                      AgriTrust::get_vyc(id: {vyc.id}u64)
                    </code>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Returns on-chain <strong className="text-foreground">VycRecord</strong> struct with status enum and hash.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Stellar Network RPC
                    </p>
                    <p className="mt-1 text-sm font-mono text-foreground truncate">
                      {SOROBAN_CONFIG.RPC_URL}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Passphrase: {SOROBAN_CONFIG.NETWORK_PASSPHRASE}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Farmer On-Chain Identity
                  </p>
                  <p className="font-mono text-sm break-all bg-background p-2 rounded border border-border">
                    {vyc.farmer}
                  </p>
                </div>

                <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Proof-of-Activity SHA-256 Digest
                  </p>
                  <p className="font-mono text-sm break-all bg-background p-2 rounded border border-border">
                    {vyc.activityHash}
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 pt-2">
                  {SOROBAN_CONFIG.CONTRACT_ID && (
                    <a
                      href={getStellarExpertContractUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View Contract on Stellar Expert
                    </a>
                  )}
                  <Link
                    href="/mint"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-xs font-semibold transition-colors hover:bg-muted"
                  >
                    Mint Another VYC
                  </Link>
                </div>
              </Card>
            </Reveal>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
