"use client";

import Link from "next/link";
import { Card, CardHeader } from "../components/ui/Card";
import { StatusBadge, ScoreRing } from "../components/ui/Badges";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { MOCK_VYCS, formatYield, shortAddress } from "../lib/mock";
import { Reveal, StaggerReveal, FloatingImage } from "../components/motion/Reveal";
import { AlertTriangle, CheckCircle2, Clock, FileText, Users, Shield } from "lucide-react";

const crops = ["MAIZE", "COCOA", "SOYBEAN", "RICE", "CASSAVA"];
const statuses = ["Active", "Redeemed", "Expired", "Cancelled"];

const recentActivity = [
  { action: "VYC #8 minted", vycId: 8, farmer: "GCP...VKX4", time: "2 hours ago", status: "success" },
  { action: "Evidence submitted", vycId: 7, farmer: "GDQ...AB12", time: "5 hours ago", status: "pending" },
  { action: "KYC approved", farmer: "GCFG...3FM4", time: "1 day ago", status: "success" },
  { action: "VYC #7 redeemed", vycId: 7, farmer: "GCP...VKX4", time: "2 days ago", status: "info" },
];

export default function Admin() {
  return (
    <>
      <SiteHeader />
      <main className="relative mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "url(/assets/abstract-background/pattern_connected_field_grid.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        <div className="relative">
          <Reveal>
            <div className="mb-8 flex items-center gap-4">
              <FloatingImage
                src="/assets/3d-reusage-icons-img/icon_harvest_crate.png"
                alt="Harvest crate"
                className="h-16 w-16 object-contain"
                duration={7}
                distance={4}
              />
              <div>
                <h1 className="text-3xl font-bold">Admin Console</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Monitor VYCs, evidence, KYC, and system health.
                </p>
              </div>
            </div>
          </Reveal>

          {/* Overview stats */}
          <StaggerReveal className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <p className="text-sm text-muted-foreground">Total VYCs</p>
              <p className="mt-1 text-3xl font-bold">{MOCK_VYCS.length}</p>
              <p className="text-xs text-muted-foreground">minted to date</p>
            </Card>
            <Card>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="mt-1 text-3xl font-bold text-primary">{MOCK_VYCS.filter((v) => v.status === "Active").length}</p>
              <p className="text-xs text-muted-foreground">currently financed</p>
            </Card>
            <Card>
              <p className="text-sm text-muted-foreground">Total value</p>
              <p className="mt-1 text-3xl font-bold">{formatYield(MOCK_VYCS.reduce((s, v) => s + v.expectedYield, 0))}</p>
              <p className="text-xs text-muted-foreground">across all certificates</p>
            </Card>
            <Card>
              <p className="text-sm text-muted-foreground">Pending reviews</p>
              <p className="mt-1 text-3xl font-bold text-amber-600">3</p>
              <p className="text-xs text-muted-foreground">evidence submissions</p>
            </Card>
          </StaggerReveal>

          {/* Filter bar */}
          <Reveal>
            <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <span className="text-sm font-medium text-muted-foreground">Filter:</span>
              <select className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm">
                <option>All crops</option>
                {crops.map((c) => <option key={c}>{c}</option>)}
              </select>
              <select className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm">
                <option>All statuses</option>
                {statuses.map((s) => <option key={s}>{s}</option>)}
              </select>
              <input
                type="text"
                placeholder="Search by address or VYC..."
                className="ml-auto min-w-[200px] flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </Reveal>

          {/* Main content with sidebar */}
          <section className="grid gap-8 lg:grid-cols-[1fr_340px]">
            {/* Certificate registry */}
            <Reveal direction="left" delay={0.1}>
              <Card className="p-0">
                <div className="p-6 pb-0 flex items-center gap-3">
                  <FloatingImage
                    src="/assets/3d-reusage-icons-img/icon_success_verified.png"
                    alt="Verified"
                    className="h-10 w-10 object-contain"
                    duration={6}
                    distance={3}
                  />
                  <CardHeader
                    title="Certificate Registry"
                    subtitle="All minted VYCs"
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-6 py-3 font-medium">VYC</th>
                        <th className="px-6 py-3 font-medium">Crop</th>
                        <th className="px-6 py-3 font-medium">Region</th>
                        <th className="px-6 py-3 font-medium">Value</th>
                        <th className="px-6 py-3 font-medium">Score</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {MOCK_VYCS.map((vyc) => (
                        <tr key={vyc.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-3 font-mono text-xs">
                            <Link
                              href={`/certificates/${vyc.id}`}
                              className="font-bold text-primary hover:underline flex items-center gap-1.5"
                            >
                              <span>VYC #{vyc.id}</span>
                              <span className="text-[10px] text-muted-foreground font-normal">
                                ({shortAddress(vyc.activityHash)})
                              </span>
                            </Link>
                          </td>
                          <td className="px-6 py-3">{vyc.crop}</td>
                          <td className="px-6 py-3">{vyc.region}</td>
                          <td className="px-6 py-3">{formatYield(vyc.expectedYield)}</td>
                          <td className="px-6 py-3">
                            <ScoreRing score={vyc.score} />
                          </td>
                          <td className="px-6 py-3">
                            <Link href={`/certificates/${vyc.id}`}>
                              <StatusBadge status={vyc.status} />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="border-t border-border p-4 px-6 text-xs text-muted-foreground">
                  <div className="flex flex-wrap gap-3">
                    {statuses.map((s) => (
                      <span key={s} className="inline-flex items-center gap-1.5">
                        <StatusBadge status={s} />
                      </span>
                    ))}
                    <span className="ml-auto hidden sm:inline">All rows are demo data.</span>
                  </div>
                </div>
              </Card>
            </Reveal>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* System health */}
              <Reveal direction="right" delay={0.12}>
                <Card>
                  <CardHeader title="System Health" subtitle="Contract & network status" />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm">Soroban contract</span>
                      </div>
                      <span className="text-xs font-medium text-emerald-600">Operational</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm">Horizon indexer</span>
                      </div>
                      <span className="text-xs font-medium text-emerald-600">Operational</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <span className="text-sm">Oracle feed</span>
                      </div>
                      <span className="text-xs font-medium text-amber-600">Degraded</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm">Friendbot</span>
                      </div>
                      <span className="text-xs font-medium text-emerald-600">Active</span>
                    </div>
                  </div>
                </Card>
              </Reveal>

              {/* Pending reviews */}
              <Reveal direction="right" delay={0.15}>
                <Card>
                  <CardHeader title="Pending Reviews" subtitle="Requires operator action" />
                  <div className="space-y-3">
                    {[
                      { label: "Evidence: Maize harvest", farmer: "GCP...VKX4", icon: FileText },
                      { label: "KYC: Adewale Capital", farmer: "GDQ...AB12", icon: Users },
                      { label: "VYC renewal request", farmer: "GCFG...3FM4", icon: Clock },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/30">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <item.icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.label}</p>
                          <p className="text-xs text-muted-foreground font-mono">{item.farmer}</p>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          Pending
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </Reveal>

              {/* Recent activity */}
              <Reveal direction="right" delay={0.18}>
                <Card>
                  <CardHeader title="Recent Activity" subtitle="Latest protocol events" />
                  <div className="space-y-3">
                    {recentActivity.map((item, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm">
                        <div className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${
                          item.status === "success" ? "bg-emerald-500" :
                          item.status === "pending" ? "bg-amber-500" : "bg-primary"
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{item.action}</p>
                          <p className="text-xs text-muted-foreground font-mono">{item.farmer}</p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </Reveal>

              {/* Quick actions */}
              <Reveal direction="right" delay={0.2}>
                <Card>
                  <CardHeader title="Quick Actions" />
                  <div className="space-y-2">
                    <button className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      Review pending KYC
                    </button>
                    <button className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Export VYC registry
                    </button>
                    <button className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted">
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                      View system alerts
                    </button>
                  </div>
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
