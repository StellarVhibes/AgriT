"use client";

import { CheckCircle2, Clock, XCircle, ShieldCheck, Landmark, Users } from "lucide-react";
import { VycLifecycleStatus, getLifecycleStageInfo, formatVycDate, formatVycDateTime } from "../../../lib/vyc";
import { Card } from "../../../components/ui/Card";
import { Reveal, StaggerReveal } from "../../../components/motion/Reveal";

interface VycLifecycleTimelineProps {
  status: VycLifecycleStatus;
  createdAt: number;
  updatedAt: number;
  vycId: string | number;
}

export function VycLifecycleTimeline({
  status,
  createdAt,
  updatedAt,
  vycId,
}: VycLifecycleTimelineProps) {
  const stageInfo = getLifecycleStageInfo(status);

  const steps = [
    {
      id: "active",
      title: "1. Minted & Active",
      description: "Certificate minted on-chain; farmer behavior verified and liquidity matched.",
      isCurrent: status === "Active",
      isPast: status === "Redeemed" || status === "Expired" || status === "Cancelled",
      badge: "Stage 1: Production",
      timestamp: createdAt,
      color: "emerald",
    },
    {
      id: "settlement",
      title: status === "Active" ? "2. Settlement / Resolution" : `2. ${status}`,
      description:
        status === "Active"
          ? "Awaiting harvest completion, crop sale weigh-in, and USDC settlement distribution."
          : stageInfo.summary,
      isCurrent: status !== "Active",
      isPast: false,
      badge: status === "Active" ? "Stage 2: Upcoming" : `Stage 2: ${status}`,
      timestamp: status !== "Active" ? updatedAt : 0,
      color:
        status === "Redeemed"
          ? "sky"
          : status === "Expired"
          ? "amber"
          : status === "Cancelled"
          ? "rose"
          : "muted",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Lifecycle Flowchart Stepper */}
      <Reveal>
        <Card className="overflow-hidden border border-border bg-card p-6">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">VYC Lifecycle State Machine</h2>
              <p className="text-sm text-muted-foreground">
                Formal Soroban state tracking for VYC #{vycId}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Current Status:
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  status === "Active"
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : status === "Redeemed"
                    ? "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                    : status === "Expired"
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                }`}
              >
                {status === "Active" && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
                {status === "Redeemed" && <CheckCircle2 className="h-3.5 w-3.5" />}
                {status === "Expired" && <Clock className="h-3.5 w-3.5" />}
                {status === "Cancelled" && <XCircle className="h-3.5 w-3.5" />}
                {status}
              </span>
            </div>
          </div>

          {/* Stepper Visualization */}
          <div className="relative my-4 grid gap-6 md:grid-cols-2">
            {steps.map((step, idx) => (
              <div
                key={step.id}
                className={`relative flex flex-col justify-between rounded-xl border p-5 transition-all ${
                  step.isCurrent
                    ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                    : step.isPast
                    ? "border-emerald-500/30 bg-card"
                    : "border-border/60 bg-muted/20 text-muted-foreground"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md bg-background/80 px-2 py-0.5 text-xs font-medium border border-border">
                      {step.badge}
                    </span>
                    {step.timestamp > 0 && (
                      <span className="text-xs font-mono text-muted-foreground">
                        {formatVycDate(step.timestamp)}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 text-base font-bold text-foreground flex items-center gap-2">
                    {step.isPast ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                    ) : step.isCurrent ? (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">
                        ✓
                      </div>
                    ) : (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full border border-muted-foreground text-muted-foreground text-xs flex-shrink-0">
                        {idx + 1}
                      </div>
                    )}
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {step.timestamp > 0 && (
                  <div className="mt-4 pt-3 border-t border-border/50 text-xs text-muted-foreground font-mono">
                    Ledger Timestamp: {formatVycDateTime(step.timestamp)}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Transition Matrix / Branching diagram */}
          <div className="mt-6 rounded-xl bg-muted/40 p-4 border border-border/60">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Allowed State Transitions from Current Node
            </h4>
            <div className="grid gap-3 sm:grid-cols-3">
              <div
                className={`rounded-lg border p-3 ${
                  status === "Active"
                    ? "border-sky-500/40 bg-sky-500/5 text-sky-950 dark:text-sky-200"
                    : status === "Redeemed"
                    ? "border-sky-500 bg-sky-500/10 font-medium"
                    : "border-border/40 opacity-40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-sky-600" /> Redeemed
                  </span>
                  {status === "Active" && (
                    <span className="text-xs bg-sky-500/20 text-sky-700 dark:text-sky-300 px-1.5 py-0.5 rounded">
                      Target
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Triggered upon certified crop sale and USDC loan settlement.
                </p>
              </div>

              <div
                className={`rounded-lg border p-3 ${
                  status === "Active"
                    ? "border-amber-500/40 bg-amber-500/5 text-amber-950 dark:text-amber-200"
                    : status === "Expired"
                    ? "border-amber-500 bg-amber-500/10 font-medium"
                    : "border-border/40 opacity-40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-amber-600" /> Expired
                  </span>
                  {status === "Active" && (
                    <span className="text-xs bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded">
                      Contingency
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Triggered if harvest window passes without off-taker weigh-in.
                </p>
              </div>

              <div
                className={`rounded-lg border p-3 ${
                  status === "Active"
                    ? "border-rose-500/40 bg-rose-500/5 text-rose-950 dark:text-rose-200"
                    : status === "Cancelled"
                    ? "border-rose-500 bg-rose-500/10 font-medium"
                    : "border-border/40 opacity-40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold flex items-center gap-1.5">
                    <XCircle className="h-4 w-4 text-rose-600" /> Cancelled
                  </span>
                  {status === "Active" && (
                    <span className="text-xs bg-rose-500/20 text-rose-700 dark:text-rose-300 px-1.5 py-0.5 rounded">
                      Exception
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Admin revoked if proof-of-activity fails cryptographic audit.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </Reveal>

      {/* Investor & Cooperative Safeguards */}
      <StaggerReveal className="grid gap-4 md:grid-cols-2">
        <Card className="border border-border bg-card p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-base">Investor Liquidity Position</h4>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                {stageInfo.investorMeaning}
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-primary font-medium">
                <ShieldCheck className="h-4 w-4" />
                <span>Smart Contract Settlement Lock: Active</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border border-border bg-card p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 flex-shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-base">Cooperative & Farmer Standing</h4>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                {stageInfo.cooperativeMeaning}
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-emerald-600 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                <span>Cooperative Depot Verification: Enabled</span>
              </div>
            </div>
          </div>
        </Card>
      </StaggerReveal>
    </div>
  );
}
