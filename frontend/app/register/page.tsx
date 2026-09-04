"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Loader2, Shield, Mail, Lock, Eye, EyeOff } from "lucide-react";

const easeOutExpo = [0.21, 0.47, 0.32, 0.98] as const;

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password || password.length < 8) return;
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    router.push("/onboarding");
    setIsLoading(false);
  }

  const isValid = email.includes("@") && password.length >= 8;

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

        {/* 3D Illustration — 2x size */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15, ease: easeOutExpo }}
          className="relative z-10 mx-auto w-full max-w-lg px-8"
        >
          <div className="relative aspect-square">
            <Image
              src="/assets/signin-login-imgs/auth_login_verified_seedling.png"
              alt="Start your farming track record"
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
            Start building your trust on-chain
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-[#5A7A60]/70 dark:text-[#9AB0A0]/60">
            Create an account to mint Verifiable Yield Certificates
            <br />
            and unlock fair financing for your farm.
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
          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOutExpo }}
            className="text-[2.25rem] font-bold leading-[1.02] text-[#1B3A20] dark:text-[#E8F0EA] sm:text-[2.75rem]"
          >
            Create your account
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: easeOutExpo }}
            className="mt-4 text-lg leading-relaxed text-[#5A7A60] dark:text-[#9AB0A0]"
          >
            Enter your details to get started with AgriTrust.
          </motion.p>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15, ease: easeOutExpo }}
            onSubmit={handleSignUp}
            className="mt-8 space-y-4"
          >
            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[#1B3A20] dark:text-[#E8F0EA]">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#8A9E8F] dark:text-[#6A8A70]" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-[#D8D5CC] bg-white py-3 pl-11 pr-4 text-[0.95rem] text-[#1B3A20] placeholder:text-[#B0ADA5] focus:border-[#3A7D44] focus:outline-none focus:ring-2 focus:ring-[#3A7D44]/20 dark:border-[#2A3D2E] dark:bg-[#162018] dark:text-[#E8F0EA] dark:placeholder:text-[#4A6A50] dark:focus:border-[#5CB86A] dark:focus:ring-[#5CB86A]/20"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[#1B3A20] dark:text-[#E8F0EA]">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#8A9E8F] dark:text-[#6A8A70]" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl border border-[#D8D5CC] bg-white py-3 pl-11 pr-11 text-[0.95rem] text-[#1B3A20] placeholder:text-[#B0ADA5] focus:border-[#3A7D44] focus:outline-none focus:ring-2 focus:ring-[#3A7D44]/20 dark:border-[#2A3D2E] dark:bg-[#162018] dark:text-[#E8F0EA] dark:placeholder:text-[#4A6A50] dark:focus:border-[#5CB86A] dark:focus:ring-[#5CB86A]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A9E8F] hover:text-[#5A7A60] dark:text-[#6A8A70] dark:hover:text-[#9AB0A0]"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
              {password.length > 0 && password.length < 8 && (
                <p className="mt-1.5 text-xs text-[#C4713A] dark:text-[#E89A5A]">
                  Password must be at least 8 characters
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !isValid}
              className="w-full rounded-xl bg-[#3A7D44] px-4 py-4 text-[0.95rem] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 dark:bg-[#5CB86A] dark:text-[#0F1A12]"
            >
              {isLoading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Sign Up"}
            </button>
          </motion.form>

          {/* Divider */}
          <div className="relative py-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#D8D5CC] dark:border-[#2A3D2E]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#F7F5EE] px-3 text-[#8A9E8F] dark:bg-[#0F1A12] dark:text-[#6A8A70]">or</span>
            </div>
          </div>

          {/* Sign in link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center text-[0.95rem] text-[#8A9E8F] dark:text-[#6A8A70]"
          >
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[#3A7D44] hover:underline dark:text-[#5CB86A]">
              Sign in
            </Link>
          </motion.p>

          {/* Privacy note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-6 flex items-start gap-2.5 rounded-xl border border-[#D8D5CC]/60 bg-white/50 px-4 py-3 dark:border-[#2A3D2E]/60 dark:bg-[#162018]/50"
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
        </div>
      </div>
    </div>
  );
}
