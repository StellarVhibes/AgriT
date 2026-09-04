"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowLeft, CheckCircle2, Wallet, ShieldCheck } from "lucide-react";
import { useFreighter } from "../hooks/useFreighter";

const easeOutExpo = [0.21, 0.47, 0.32, 0.98] as const;

const entityTypes = [
  "Commercial Bank",
  "Microfinance Bank",
  "Insurance Company",
  "Impact Fund",
  "Individual Investor",
  "Cooperative",
];

export default function KycPage() {
  const router = useRouter();
  const [step, setStep] = useState<"wallet" | "kyc" | "done">("wallet");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { address, isConnected, isLoading: walletLoading, error: walletError, connect } = useFreighter();

  const [form, setForm] = useState({
    fullName: "",
    entityType: "",
    email: "",
    country: "",
  });

  async function handleConnectWallet() {
    await connect();
  }

  async function handleSubmitKyc() {
    if (!form.fullName || !form.entityType || !form.email) return;
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 2000));
    setStep("done");
    setIsSubmitting(false);
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* ── Left — Visual trust panel ── */}
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#E8F5EA] via-[#F0FAF2] to-[#F7F5EE] lg:w-1/2 dark:from-[#0A120C] dark:via-[#0F1A12] dark:to-[#122016]">
        {/* Logo — top-left corner, tight to edge */}
        <Link href="/" className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 sm:left-6 sm:top-6">
          <Image
            src="/agrit-logo.svg"
            alt="AgriTrust"
            width={36}
            height={36}
            className="h-9 w-9"
          />
        </Link>

        {/* 3D Illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15, ease: easeOutExpo }}
          className="relative z-10 mx-auto w-full max-w-lg px-8"
        >
          <div className="relative aspect-square">
            <Image
              src="/assets/3d-reusage-icons-img/icon_verified_certificate.png"
              alt="KYC verification"
              fill
              sizes="700px"
              className="object-contain"
              priority
            />
          </div>
        </motion.div>

        {/* Caption */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease: easeOutExpo }}
          className="relative z-10 mt-6 text-center"
        >
          <p className="text-base font-semibold text-[#3A6A42] dark:text-[#7AAA80]">
            Verify once, invest freely
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-[#5A7A60]/70 dark:text-[#9AB0A0]/60">
            Complete KYC to unlock lending,
            <br />
            insurance, and investment features.
          </p>
        </motion.div>
      </div>

      {/* ── Right — Auth panel ── */}
      <div className="relative flex w-full flex-col justify-center bg-[#F7F5EE] px-8 py-12 dark:bg-[#0F1A12] lg:w-1/2 lg:px-16 lg:py-0">
        {/* Abstract background pattern */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "url(/assets/abstract-background/pattern_bridge_network.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        <div className="relative mx-auto w-full max-w-[420px]">
          {/* Back button — top-left of right panel */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            onClick={() => window.history.back()}
            className="absolute -left-16 top-0 flex h-10 w-10 items-center justify-center rounded-full border border-[#D8D5CC] bg-white text-[#5A7A60] shadow-sm transition-all hover:bg-[#F0FAF2] hover:text-[#3A7D44] hover:shadow-md dark:border-[#2A3D2E] dark:bg-[#162018] dark:text-[#9AB0A0] dark:hover:bg-[#1A2A1E] dark:hover:text-[#5CB86A] lg:-left-20"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </motion.button>

          <AnimatePresence mode="wait">
            {step === "wallet" && (
              <motion.div
                key="wallet"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: easeOutExpo }}
              >
                <h1 className="text-[2.25rem] font-bold leading-[1.02] text-[#1B3A20] dark:text-[#E8F0EA] sm:text-[2.75rem]">
                  Lender Onboarding
                </h1>
                <p className="mt-4 text-lg leading-relaxed text-[#5A7A60] dark:text-[#9AB0A0]">
                  Connect your Freighter wallet to get started. You&apos;ll complete KYC after connecting.
                </p>

                <div className="mt-8 rounded-2xl border border-[#D8D5CC] bg-white p-6 dark:border-[#2A3D2E] dark:bg-[#162018]">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3A7D44]/10 text-[#3A7D44] dark:bg-[#5CB86A]/10 dark:text-[#5CB86A]">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#1B3A20] dark:text-[#E8F0EA]">Step 1: Connect Wallet</p>
                      <p className="text-sm text-[#8A9E8F] dark:text-[#6A8A70]">Self-custody via Freighter</p>
                    </div>
                  </div>

                  {walletError && (
                    <div className="mb-4 rounded-xl border border-[#C4713A]/30 bg-[#C4713A]/5 p-3 text-sm text-[#C4713A] dark:border-[#E89A5A]/30 dark:bg-[#E89A5A]/5 dark:text-[#E89A5A]">
                      {walletError}
                    </div>
                  )}

                  {!isConnected ? (
                    <button
                      onClick={handleConnectWallet}
                      disabled={walletLoading}
                      className="w-full rounded-xl bg-[#3A7D44] px-4 py-4 text-[0.95rem] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-[#5CB86A] dark:text-[#0F1A12]"
                    >
                      {walletLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Connecting...
                        </span>
                      ) : (
                        "Connect Freighter Wallet"
                      )}
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 rounded-lg bg-[#3A7D44]/10 px-3 py-2 text-sm font-medium text-[#3A7D44] dark:bg-[#5CB86A]/10 dark:text-[#5CB86A]">
                        <CheckCircle2 className="h-4 w-4" />
                        Connected
                      </div>
                      <p className="font-mono text-xs text-[#8A9E8F] break-all dark:text-[#6A8A70]">
                        {address}
                      </p>
                      <button
                        onClick={() => setStep("kyc")}
                        className="w-full rounded-xl bg-[#3A7D44] px-4 py-4 text-[0.95rem] font-semibold text-white transition-opacity hover:opacity-90 dark:bg-[#5CB86A] dark:text-[#0F1A12]"
                      >
                        Continue to KYC
                      </button>
                    </div>
                  )}

                  <p className="mt-4 text-xs text-[#8A9E8F] text-center dark:text-[#6A8A70]">
                    Don&apos;t have Freighter?{" "}
                    <a
                      href="https://freighter.app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#3A7D44] underline-offset-2 hover:underline dark:text-[#5CB86A]"
                    >
                      Install it here
                    </a>
                  </p>
                </div>

                <p className="mt-6 text-center text-[0.95rem] text-[#8A9E8F] dark:text-[#6A8A70]">
                  Are you a <strong className="text-[#1B3A20] dark:text-[#E8F0EA]">farmer</strong>?{" "}
                  <Link href="/register" className="font-semibold text-[#3A7D44] hover:underline dark:text-[#5CB86A]">
                    Sign up here instead
                  </Link>
                </p>
              </motion.div>
            )}

            {step === "kyc" && (
              <motion.div
                key="kyc"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: easeOutExpo }}
              >
                <h1 className="text-[2.25rem] font-bold leading-[1.02] text-[#1B3A20] dark:text-[#E8F0EA] sm:text-[2.75rem]">
                  KYC Verification
                </h1>
                <p className="mt-4 text-lg leading-relaxed text-[#5A7A60] dark:text-[#9AB0A0]">
                  Required for lending and investing. Your information is kept confidential.
                </p>

                <div className="mt-8 rounded-2xl border border-[#D8D5CC] bg-white p-6 dark:border-[#2A3D2E] dark:bg-[#162018]">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3A7D44]/10 text-[#3A7D44] dark:bg-[#5CB86A]/10 dark:text-[#5CB86A]">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#1B3A20] dark:text-[#E8F0EA]">Step 2: KYC Details</p>
                      <p className="text-sm text-[#8A9E8F] dark:text-[#6A8A70]">Identity and entity information</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-[#1B3A20] dark:text-[#E8F0EA]">
                        Full name / Organization name
                      </label>
                      <input
                        id="fullName"
                        type="text"
                        value={form.fullName}
                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                        placeholder="e.g. Adewale Capital Ltd."
                        className="w-full rounded-xl border border-[#D8D5CC] bg-[#F7F5EE] px-4 py-3.5 text-[0.95rem] text-[#1B3A20] placeholder:text-[#B0ADA5] focus:border-[#3A7D44] focus:outline-none focus:ring-2 focus:ring-[#3A7D44]/20 dark:border-[#2A3D2E] dark:bg-[#0F1A12] dark:text-[#E8F0EA] dark:placeholder:text-[#4A6A50] dark:focus:border-[#5CB86A] dark:focus:ring-[#5CB86A]/20"
                      />
                    </div>

                    <div>
                      <label htmlFor="entityType" className="mb-1.5 block text-sm font-medium text-[#1B3A20] dark:text-[#E8F0EA]">
                        Entity type
                      </label>
                      <select
                        id="entityType"
                        value={form.entityType}
                        onChange={(e) => setForm({ ...form, entityType: e.target.value })}
                        className="w-full rounded-xl border border-[#D8D5CC] bg-[#F7F5EE] px-4 py-3.5 text-[0.95rem] text-[#1B3A20] focus:border-[#3A7D44] focus:outline-none focus:ring-2 focus:ring-[#3A7D44]/20 dark:border-[#2A3D2E] dark:bg-[#0F1A12] dark:text-[#E8F0EA] dark:focus:border-[#5CB86A] dark:focus:ring-[#5CB86A]/20"
                      >
                        <option value="">Select entity type</option>
                        {entityTypes.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[#1B3A20] dark:text-[#E8F0EA]">
                        Contact email
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="kyc@example.com"
                        className="w-full rounded-xl border border-[#D8D5CC] bg-[#F7F5EE] px-4 py-3.5 text-[0.95rem] text-[#1B3A20] placeholder:text-[#B0ADA5] focus:border-[#3A7D44] focus:outline-none focus:ring-2 focus:ring-[#3A7D44]/20 dark:border-[#2A3D2E] dark:bg-[#0F1A12] dark:text-[#E8F0EA] dark:placeholder:text-[#4A6A50] dark:focus:border-[#5CB86A] dark:focus:ring-[#5CB86A]/20"
                      />
                    </div>

                    <div>
                      <label htmlFor="country" className="mb-1.5 block text-sm font-medium text-[#1B3A20] dark:text-[#E8F0EA]">
                        Country
                      </label>
                      <input
                        id="country"
                        type="text"
                        value={form.country}
                        onChange={(e) => setForm({ ...form, country: e.target.value })}
                        placeholder="Nigeria"
                        className="w-full rounded-xl border border-[#D8D5CC] bg-[#F7F5EE] px-4 py-3.5 text-[0.95rem] text-[#1B3A20] placeholder:text-[#B0ADA5] focus:border-[#3A7D44] focus:outline-none focus:ring-2 focus:ring-[#3A7D44]/20 dark:border-[#2A3D2E] dark:bg-[#0F1A12] dark:text-[#E8F0EA] dark:placeholder:text-[#4A6A50] dark:focus:border-[#5CB86A] dark:focus:ring-[#5CB86A]/20"
                      />
                    </div>

                    <button
                      onClick={handleSubmitKyc}
                      disabled={isSubmitting || !form.fullName || !form.entityType || !form.email}
                      className="w-full rounded-xl bg-[#3A7D44] px-4 py-4 text-[0.95rem] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 dark:bg-[#5CB86A] dark:text-[#0F1A12]"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Submitting...
                        </span>
                      ) : (
                        "Submit KYC"
                      )}
                    </button>

                    <button
                      onClick={() => setStep("wallet")}
                      className="w-full text-sm text-[#8A9E8F] hover:text-[#3A7D44] dark:text-[#6A8A70] dark:hover:text-[#5CB86A]"
                    >
                      Back to wallet
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === "done" && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: easeOutExpo }}
                className="text-center"
              >
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#3A7D44]/10 dark:bg-[#5CB86A]/10">
                  <ShieldCheck className="h-10 w-10 text-[#3A7D44] dark:text-[#5CB86A]" />
                </div>
                <h1 className="text-[2.25rem] font-bold text-[#1B3A20] dark:text-[#E8F0EA] sm:text-[2.75rem]">
                  KYC Submitted
                </h1>
                <p className="mt-4 text-lg leading-relaxed text-[#5A7A60] max-w-md mx-auto dark:text-[#9AB0A0]">
                  Your verification is being reviewed. You&apos;ll receive an email once approved.
                  In the meantime, you can explore the protocol.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                  <button
                    onClick={() => router.push("/")}
                    className="rounded-xl bg-[#3A7D44] px-6 py-3 text-[0.95rem] font-semibold text-white transition-opacity hover:opacity-90 dark:bg-[#5CB86A] dark:text-[#0F1A12]"
                  >
                    Back to Home
                  </button>
                  <button
                    onClick={() => router.push("/score")}
                    className="rounded-xl border border-[#D8D5CC] bg-white px-6 py-3 text-[0.95rem] font-semibold text-[#1B3A20] transition-colors hover:bg-[#F0FAF2] dark:border-[#2A3D2E] dark:bg-[#162018] dark:text-[#E8F0EA] dark:hover:bg-[#1A2A1E]"
                  >
                    Explore Scoring
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
