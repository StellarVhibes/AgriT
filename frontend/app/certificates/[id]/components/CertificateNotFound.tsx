"use client";

import Link from "next/link";
import { ArrowLeft, Plus, ShieldAlert } from "lucide-react";
import { Card } from "../../../components/ui/Card";
import { Reveal, FloatingImage } from "../../../components/motion/Reveal";

interface CertificateNotFoundProps {
  id: string;
  errorDetail?: string;
}

export function CertificateNotFound({ id, errorDetail }: CertificateNotFoundProps) {
  return (
    <main className="relative mx-auto max-w-3xl px-4 sm:px-6 py-16">
      <Reveal>
        <Card className="border border-border/80 bg-card p-8 sm:p-12 text-center shadow-lg">
          <div className="mx-auto flex justify-center mb-6">
            <FloatingImage
              src="/assets/3d-reusage-icons-img/icon_failure_alert.png"
              alt="Certificate Not Found"
              className="h-24 w-24 object-contain"
              duration={6}
              distance={4}
            />
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
            <ShieldAlert className="h-3.5 w-3.5" /> 404 — Certificate Not Found
          </span>

          <h1 className="mt-4 text-2xl sm:text-3xl font-bold">
            Certificate #{id} Does Not Exist
          </h1>

          <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            {errorDetail ||
              `The requested Verifiable Yield Certificate (VYC #${id}) could not be found on the Soroban smart contract ledger or local demo registry.`}
          </p>

          <div className="mt-8 rounded-xl bg-muted/50 p-4 max-w-md mx-auto text-left text-xs text-muted-foreground border border-border/60">
            <h4 className="font-semibold text-foreground mb-1.5">Common reasons:</h4>
            <ul className="list-disc pl-4 space-y-1">
              <li>The certificate ID was typed incorrectly or does not exist on-chain.</li>
              <li>The certificate was recently submitted and is still awaiting ledger inclusion.</li>
              <li>The network configuration is set to a different Stellar environment (Testnet vs Mainnet).</li>
            </ul>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
            <Link
              href="/mint"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Mint New Certificate
            </Link>
          </div>
        </Card>
      </Reveal>
    </main>
  );
}
