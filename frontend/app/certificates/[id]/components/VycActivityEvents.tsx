"use client";

import { useState } from "react";
import { CheckCircle2, Clock, ShieldCheck, Copy, Check, Calendar, MapPin, Tag, FileCode } from "lucide-react";
import { VycActivityEvent, isValidActivityHash } from "../../../lib/vyc";
import { Card } from "../../../components/ui/Card";
import { Reveal, FloatingImage } from "../../../components/motion/Reveal";

interface VycActivityEventsProps {
  events: VycActivityEvent[];
  activityHash: string;
  crop: string;
  region: string;
}

export function VycActivityEvents({
  events,
  activityHash,
  crop,
  region,
}: VycActivityEventsProps) {
  const [copiedHash, setCopiedHash] = useState(false);
  const isHashValid = isValidActivityHash(activityHash);

  const copyHash = () => {
    if (!activityHash) return;
    navigator.clipboard.writeText(activityHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const getEventIcon = (type: VycActivityEvent["type"]) => {
    switch (type) {
      case "season_start":
        return "/assets/3d-reusage-icons-img/icon_wallet_stablecoin.png";
      case "planting":
        return "/assets/3d-reusage-icons-img/icon_planting_seed.png";
      case "inspection":
        return "/assets/3d-reusage-icons-img/icon_verified_certificate.png";
      case "harvest":
        return "/assets/3d-reusage-icons-img/icon_harvest_crate.png";
      case "sale":
        return "/assets/3d-reusage-icons-img/icon_transaction_transfer.png";
    }
  };

  return (
    <div className="space-y-6">
      {/* Proof-of-Activity SHA-256 Audit Bar */}
      <Reveal>
        <Card className="border border-border bg-card p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-base">On-Chain Proof-of-Activity Hash</h3>
                  <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
                    SHA-256 Verified
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Every season event is cryptographically committed on the Stellar ledger
                </p>
              </div>
            </div>
            <button
              onClick={copyHash}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
            >
              {copiedHash ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Hash</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-4 rounded-lg bg-muted/60 p-3 font-mono text-xs text-foreground break-all border border-border/60">
            {activityHash || "0000000000000000000000000000000000000000000000000000000000000000"}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Tag className="h-3.5 w-3.5 text-primary" /> Crop: <strong className="text-foreground">{crop}</strong>
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-primary" /> Region: <strong className="text-foreground">{region}</strong>
            </span>
            <span className="flex items-center gap-1">
              <FileCode className="h-3.5 w-3.5 text-primary" /> Hash Format:{" "}
              <strong className={isHashValid ? "text-emerald-600" : "text-amber-600"}>
                {isHashValid ? "Valid 64-Hex Standard" : "Simulation Format"}
              </strong>
            </span>
          </div>
        </Card>
      </Reveal>

      {/* Activity Events Timeline */}
      <Reveal delay={0.1}>
        <Card className="border border-border bg-card p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Underlying Activity Events</h2>
              <p className="text-sm text-muted-foreground">
                Chronological proof-of-activity logs backing this certificate
              </p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {events.length} Logged Events
            </span>
          </div>

          <div className="relative border-l-2 border-border/80 ml-4 pl-6 space-y-8">
            {events.map((evt, idx) => (
              <div key={evt.id} className="relative group">
                {/* Timeline node icon */}
                <div className="absolute -left-[37px] top-1.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-card shadow-sm">
                  {evt.status === "verified" || evt.status === "completed" || evt.status === "settled" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Clock className="h-4 w-4 text-amber-600 animate-pulse" />
                  )}
                </div>

                {/* Event Card */}
                <div className="rounded-xl border border-border bg-background/50 p-4 transition-all hover:border-primary/40 hover:bg-card">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-3">
                      <FloatingImage
                        src={getEventIcon(evt.type)}
                        alt={evt.title}
                        className="h-10 w-10 object-contain flex-shrink-0"
                        duration={7 + (idx % 3)}
                        distance={3}
                      />
                      <div>
                        <h4 className="font-semibold text-base text-foreground">{evt.title}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {evt.date}
                          </span>
                          {evt.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {evt.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start">
                      {evt.amountLabel && (
                        <span className="rounded-md bg-muted px-2 py-1 text-xs font-semibold text-foreground">
                          {evt.amountLabel}
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          evt.status === "settled"
                            ? "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                            : evt.status === "verified" || evt.status === "completed"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {evt.status === "settled"
                          ? "Settled"
                          : evt.status === "verified"
                          ? "Verified"
                          : evt.status === "completed"
                          ? "Completed"
                          : "Scheduled"}
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    {evt.description}
                  </p>

                  <div className="mt-3 pt-3 border-t border-border/40 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="font-mono truncate max-w-xs">
                      Evidence: <code className="text-foreground">{evt.evidenceHash}</code>
                    </span>
                    <span>
                      Attestor: <strong className="text-foreground">{evt.verifiedBy}</strong>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </Reveal>
    </div>
  );
}
