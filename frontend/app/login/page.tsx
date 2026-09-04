"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowLeft, Wallet, Shield, Phone, ChevronRight, Eye, EyeOff } from "lucide-react";
import { useFreighter } from "../hooks/useFreighter";

const easeOutExpo = [0.21, 0.47, 0.32, 0.98] as const;

type View = "choose" | "farmer-phone" | "lender-wallet";

export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState<View>("choose");
  const [phone, setPhone] = useState("");
  const [secretWord, setSecretWord] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { address, isConnected, isLoading: walletLoading, error: walletError, connect } = useFreighter();

  async function handlePhoneLogin() {
    if (!phone || phone.length < 10 || !secretWord) return;
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    router.push("/dashboard");
    setIsLoading(false);
  }

  async function handleGoogleLogin() {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    router.push("/dashboard");
    setIsLoading(false);
  }

  async function handleFacebookLogin() {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    router.push("/dashboard");
    setIsLoading(false);
  }

  async function handleWalletConnect() {
    setIsLoading(true);
    await connect();
    setIsLoading(false);
    if (isConnected || address) {
      router.push("/dashboard");
    }
  }

  const phoneValid = phone.length >= 10 && secretWord.length >= 1;

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* ── Left — Visual trust panel ── */}
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#E8F5EA] via-[#F0FAF2] to-[#F7F5EE] lg:w-1/2 dark:from-[#0A120C] dark:via-[#0F1A12] dark:to-[#122016]">
        {/* Faint abstract line pattern */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]" aria-hidden>
          <defs>
            <pattern id="login-lines" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="1.5" fill="currentColor" className="text-[#3A7D44] dark:text-[#5CB86A]" />
              <line x1="0" y1="30" x2="60" y2="30" stroke="currentColor" strokeWidth="0.5" className="text-[#3A7D44] dark:text-[#5CB86A]" />
              <line x1="30" y1="0" x2="30" y2="60" stroke="currentColor" strokeWidth="0.5" className="text-[#3A7D44] dark:text-[#5CB86A]" />
              <circle cx="30" cy="30" r="12" fill="none" stroke="currentColor" strokeWidth="0.4" className="text-[#3A7D44] dark:text-[#5CB86A]" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#login-lines)" />
        </svg>

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
              src="/assets/signin-login-imgs/auth_login_verified_seedling.png"
              alt="Secure access to your trust certificates"
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
            Your trust, always accessible
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-[#5A7A60]/70 dark:text-[#9AB0A0]/60">
            Farmers: sign in with phone or Google — no wallet needed.
            <br />
            Lenders: connect Freighter and complete KYC.
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
            backgroundImage: "url(/assets/abstract-background/pattern_organic_growth.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        <div className="relative mx-auto w-full max-w-[420px]">
          {/* Back button */}
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

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOutExpo }}
            className="text-[2.25rem] font-bold leading-[1.02] text-[#1B3A20] dark:text-[#E8F0EA] sm:text-[2.75rem]"
          >
            Welcome back
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: easeOutExpo }}
            className="mt-4 text-lg leading-relaxed text-[#5A7A60] dark:text-[#9AB0A0]"
          >
            Sign in simply. AgriTrust handles the Web3 complexity for you.
          </motion.p>

          {/* Auth actions */}
          <AnimatePresence mode="wait">
            {view === "choose" && (
              <motion.div
                key="choose"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: easeOutExpo }}
                className="mt-8 space-y-3"
              >
                {/* Google */}
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#D8D5CC] bg-white px-4 py-4 text-[0.95rem] font-medium text-[#1B3A20] transition-all hover:border-[#3A7D44] hover:shadow-sm disabled:opacity-50 dark:border-[#2A3D2E] dark:bg-[#162018] dark:text-[#E8F0EA] dark:hover:border-[#5CB86A]"
                >
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Sign in with Google
                </button>

                {/* Facebook */}
                <button
                  onClick={handleFacebookLogin}
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#D8D5CC] bg-white px-4 py-4 text-[0.95rem] font-medium text-[#1B3A20] transition-all hover:border-[#3A7D44] hover:shadow-sm disabled:opacity-50 dark:border-[#2A3D2E] dark:bg-[#162018] dark:text-[#E8F0EA] dark:hover:border-[#5CB86A]"
                >
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Sign in with Facebook
                </button>

                {/* Divider */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#D8D5CC] dark:border-[#2A3D2E]" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-[#F7F5EE] px-3 text-[#8A9E8F] dark:bg-[#0F1A12] dark:text-[#6A8A70]">or</span>
                  </div>
                </div>

                {/* Continue with phone */}
                <button
                  onClick={() => setView("farmer-phone")}
                  className="flex w-full items-center gap-3 rounded-xl border border-[#3A7D44] bg-white px-4 py-4 text-left text-[0.95rem] font-medium text-[#1B3A20] transition-all hover:bg-[#F0FAF2] dark:border-[#5CB86A] dark:bg-[#162018] dark:text-[#E8F0EA] dark:hover:bg-[#1A2A1E]"
                >
                  <Phone className="h-5 w-5 shrink-0 text-[#3A7D44] dark:text-[#5CB86A]" />
                  Continue with phone number
                </button>

                {/* Divider — Farmer vs Lender */}
                <div className="relative py-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#D8D5CC] dark:border-[#2A3D2E]" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-[#F7F5EE] px-3 text-[#8A9E8F] dark:bg-[#0F1A12] dark:text-[#6A8A70]">or</span>
                  </div>
                </div>

                {/* Lender / Investor section */}
                <div className="rounded-2xl border border-[#D8D5CC] bg-white p-5 dark:border-[#2A3D2E] dark:bg-[#162018]">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#8A9E8F] dark:text-[#6A8A70]">
                    Investor or Lender?
                  </p>
                  <button
                    onClick={() => setView("lender-wallet")}
                    className="group flex w-full items-center gap-4 rounded-xl border border-[#D8D5CC] bg-[#F7F5EE] px-4 py-4 text-left transition-all hover:border-[#3A7D44] hover:shadow-sm dark:border-[#2A3D2E] dark:bg-[#0F1A12] dark:hover:border-[#5CB86A]"
                  >
                    <Wallet className="h-6 w-6 shrink-0 text-[#5A7A60] group-hover:text-[#3A7D44] dark:text-[#9AB0A0] dark:group-hover:text-[#5CB86A]" />
                    <div className="flex-1">
                      <p className="text-[0.95rem] font-semibold text-[#1B3A20] dark:text-[#E8F0EA]">
                        Connect your wallet
                      </p>
                      <p className="text-sm text-[#8A9E8F] dark:text-[#6A8A70]">
                        Access investor tools and settlement features
                      </p>
                    </div>
                    <Image
                      src="/assets/3d-reusage-icons-img/icon_liquidity_pool.png"
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10 shrink-0 opacity-60 transition-opacity group-hover:opacity-100"
                    />
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#B0ADA5] group-hover:text-[#3A7D44] dark:text-[#4A6A50] dark:group-hover:text-[#5CB86A]" />
                  </button>
                </div>
              </motion.div>
            )}

            {view === "farmer-phone" && (
              <motion.div
                key="farmer-phone"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: easeOutExpo }}
                className="mt-8 space-y-4"
              >
                <div>
                  <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-[#1B3A20] dark:text-[#E8F0EA]">
                    Phone number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#8A9E8F] dark:text-[#6A8A70]" />
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+234 801 234 5678"
                      className="w-full rounded-xl border border-[#D8D5CC] bg-white py-3 pl-11 pr-4 text-[0.95rem] text-[#1B3A20] placeholder:text-[#B0ADA5] focus:border-[#3A7D44] focus:outline-none focus:ring-2 focus:ring-[#3A7D44]/20 dark:border-[#2A3D2E] dark:bg-[#162018] dark:text-[#E8F0EA] dark:placeholder:text-[#4A6A50] dark:focus:border-[#5CB86A] dark:focus:ring-[#5CB86A]/20"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="secretWord" className="mb-1.5 block text-sm font-medium text-[#1B3A20] dark:text-[#E8F0EA]">
                    Secret word or phrase
                  </label>
                  <div className="relative">
                    <svg className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#8A9E8F] dark:text-[#6A8A70]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                    <input
                      id="secretWord"
                      type={showSecret ? "text" : "password"}
                      value={secretWord}
                      onChange={(e) => setSecretWord(e.target.value)}
                      placeholder="Your security phrase"
                      className="w-full rounded-xl border border-[#D8D5CC] bg-white py-3 pl-11 pr-11 text-[0.95rem] text-[#1B3A20] placeholder:text-[#B0ADA5] focus:border-[#3A7D44] focus:outline-none focus:ring-2 focus:ring-[#3A7D44]/20 dark:border-[#2A3D2E] dark:bg-[#162018] dark:text-[#E8F0EA] dark:placeholder:text-[#4A6A50] dark:focus:border-[#5CB86A] dark:focus:ring-[#5CB86A]/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A9E8F] hover:text-[#5A7A60] dark:text-[#6A8A70] dark:hover:text-[#9AB0A0]"
                      tabIndex={-1}
                    >
                      {showSecret ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>
                <button
                  onClick={handlePhoneLogin}
                  disabled={isLoading || !phoneValid}
                  className="w-full rounded-xl bg-[#3A7D44] px-4 py-4 text-[0.95rem] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 dark:bg-[#5CB86A] dark:text-[#0F1A12]"
                >
                  {isLoading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Sign In"}
                </button>
                <button
                  onClick={() => { setView("choose"); setPhone(""); setSecretWord(""); }}
                  className="inline-flex items-center gap-1 text-sm text-[#8A9E8F] hover:text-[#3A7D44] dark:text-[#6A8A70] dark:hover:text-[#5CB86A]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </button>
              </motion.div>
            )}

            {view === "lender-wallet" && (
              <motion.div
                key="lender-wallet"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: easeOutExpo }}
                className="mt-8"
              >
                <div className="rounded-2xl border border-[#3A7D44]/20 bg-white p-6 dark:border-[#5CB86A]/20 dark:bg-[#162018]">
                  <div className="mb-4 flex items-center gap-3">
                    <Wallet className="h-6 w-6 text-[#3A7D44] dark:text-[#5CB86A]" />
                    <div>
                      <p className="text-[0.95rem] font-semibold text-[#1B3A20] dark:text-[#E8F0EA]">Connect Freighter Wallet</p>
                      <p className="text-sm text-[#8A9E8F] dark:text-[#6A8A70]">For lenders, insurers &amp; investors</p>
                    </div>
                  </div>

                  {walletError && (
                    <div className="mb-4 rounded-xl border border-[#C4713A]/30 bg-[#C4713A]/5 p-3 text-sm text-[#C4713A] dark:border-[#E89A5A]/30 dark:bg-[#E89A5A]/5 dark:text-[#E89A5A]">
                      {walletError}
                    </div>
                  )}

                  {isConnected && address ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 rounded-lg bg-[#3A7D44]/10 px-3 py-2 text-sm font-medium text-[#3A7D44] dark:bg-[#5CB86A]/10 dark:text-[#5CB86A]">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                        Connected
                      </div>
                      <p className="font-mono text-xs text-[#8A9E8F] break-all dark:text-[#6A8A70]">
                        {address}
                      </p>
                      <button
                        onClick={() => router.push("/dashboard")}
                        className="w-full rounded-xl bg-[#3A7D44] px-4 py-4 text-[0.95rem] font-semibold text-white transition-opacity hover:opacity-90 dark:bg-[#5CB86A] dark:text-[#0F1A12]"
                      >
                        Go to Dashboard
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleWalletConnect}
                      disabled={isLoading || walletLoading}
                      className="w-full rounded-xl bg-[#3A7D44] px-4 py-4 text-[0.95rem] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-[#5CB86A] dark:text-[#0F1A12]"
                    >
                      {isLoading || walletLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Connecting...
                        </span>
                      ) : (
                        "Connect Wallet"
                      )}
                    </button>
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
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setView("choose")}
                    className="inline-flex items-center gap-1 text-sm text-[#8A9E8F] hover:text-[#3A7D44] dark:text-[#6A8A70] dark:hover:text-[#5CB86A]"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Privacy note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8 flex items-start gap-2.5 rounded-xl border border-[#D8D5CC]/60 bg-white/50 px-4 py-3 dark:border-[#2A3D2E]/60 dark:bg-[#162018]/50"
          >
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-[#3A7D44] dark:text-[#5CB86A]" />
            <div>
              <p className="text-sm font-medium text-[#1B3A20] dark:text-[#E8F0EA]">
                Your personal information stays private.
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#8A9E8F] dark:text-[#6A8A70]">
                We never share your data without your consent.
              </p>
            </div>
          </motion.div>

          {/* Sign up link */}
          <div className="mt-6 text-center">
            <p className="text-[0.95rem] text-[#8A9E8F] dark:text-[#6A8A70]">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-[#3A7D44] hover:underline dark:text-[#5CB86A]">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
