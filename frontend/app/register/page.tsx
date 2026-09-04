"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  ArrowLeft,
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  Globe,
  Check,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { useFreighter } from "../hooks/useFreighter";

const easeOutExpo = [0.21, 0.47, 0.32, 0.98] as const;

const regions = [
  { code: "NG-OYO", label: "Oyo State" },
  { code: "NG-ON", label: "Ondo State" },
  { code: "NG-KW", label: "Kwara State" },
  { code: "NG-EB", label: "Ebonyi State" },
  { code: "NG-KN", label: "Kano State" },
  { code: "NG-AB", label: "Abia State" },
];

const crops = [
  { id: "MAIZE", label: "Maize", icon: "🌽" },
  { id: "COCOA", label: "Cocoa", icon: "🫘" },
  { id: "SOYBEAN", label: "Soybean", icon: "🫛" },
  { id: "RICE", label: "Rice", icon: "🌾" },
  { id: "CASSAVA", label: "Cassava", icon: "🥔" },
];

type RegStep = "details" | "kyc";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<RegStep>("details");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1 — Your details
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [secretWord, setSecretWord] = useState("");

  // Step 2 — KYC
  const [region, setRegion] = useState("");
  const [crop, setCrop] = useState("");

  const detailsValid = fullName && email.includes("@") && phone.length >= 10 && password.length >= 8 && secretWord.length >= 2;
  const kycValid = region !== "" && crop !== "";

  async function handleDetailsContinue() {
    if (!detailsValid) return;
    setStep("kyc");
  }

  async function handleComplete() {
    if (!kycValid) return;
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    router.push("/dashboard");
    setIsLoading(false);
  }

  async function handleGoogleSignUp() {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    router.push("/dashboard");
    setIsLoading(false);
  }

  async function handleFacebookSignUp() {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    router.push("/dashboard");
    setIsLoading(false);
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* ── Left — Visual trust panel ── */}
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#E8F5EA] via-[#F0FAF2] to-[#F7F5EE] lg:w-1/2 dark:from-[#0A120C] dark:via-[#0F1A12] dark:to-[#122016]">
        {/* Faint abstract line pattern */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]" aria-hidden>
          <defs>
            <pattern id="reg-lines" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="1.5" fill="currentColor" className="text-[#3A7D44] dark:text-[#5CB86A]" />
              <line x1="0" y1="30" x2="60" y2="30" stroke="currentColor" strokeWidth="0.5" className="text-[#3A7D44] dark:text-[#5CB86A]" />
              <line x1="30" y1="0" x2="30" y2="60" stroke="currentColor" strokeWidth="0.5" className="text-[#3A7D44] dark:text-[#5CB86A]" />
              <circle cx="30" cy="30" r="12" fill="none" stroke="currentColor" strokeWidth="0.4" className="text-[#3A7D44] dark:text-[#5CB86A]" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#reg-lines)" />
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

          {/* Step indicator */}
          <div className="mb-6 flex items-center gap-2 text-xs font-medium text-[#8A9E8F] dark:text-[#6A8A70]">
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${step === "details" ? "bg-[#3A7D44] text-white dark:bg-[#5CB86A] dark:text-[#0F1A12]" : "bg-[#3A7D44]/20 text-[#3A7D44] dark:bg-[#5CB86A]/20 dark:text-[#5CB86A]"}`}>
              1
            </span>
            <div className={`h-px flex-1 ${step === "kyc" ? "bg-[#3A7D44] dark:bg-[#5CB86A]" : "bg-[#D8D5CC] dark:bg-[#2A3D2E]"}`} />
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${step === "kyc" ? "bg-[#3A7D44] text-white dark:bg-[#5CB86A] dark:text-[#0F1A12]" : "bg-[#D8D5CC] text-[#8A9E8F] dark:bg-[#2A3D2E] dark:text-[#6A8A70]"}`}>
              2
            </span>
          </div>

          <AnimatePresence mode="wait">
            {/* ═══ STEP 1 — Your details ═══ */}
            {step === "details" && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: easeOutExpo }}
              >
                <h1 className="text-[2rem] font-bold leading-[1.02] text-[#1B3A20] dark:text-[#E8F0EA] sm:text-[2.5rem]">
                  Your details
                </h1>
                <p className="mt-3 text-lg text-[#5A7A60] dark:text-[#9AB0A0]">
                  Create your account to get started with AgriTrust.
                </p>

                <div className="mt-8 space-y-4">
                  {/* Full Name */}
                  <div>
                    <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-[#1B3A20] dark:text-[#E8F0EA]">
                      Full Name
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Adewale Okafor"
                      className="w-full rounded-xl border border-[#D8D5CC] bg-white px-4 py-3.5 text-[0.95rem] text-[#1B3A20] placeholder:text-[#B0ADA5] focus:border-[#3A7D44] focus:outline-none focus:ring-2 focus:ring-[#3A7D44]/20 dark:border-[#2A3D2E] dark:bg-[#162018] dark:text-[#E8F0EA] dark:placeholder:text-[#4A6A50] dark:focus:border-[#5CB86A] dark:focus:ring-[#5CB86A]/20"
                    />
                  </div>

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

                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-[#1B3A20] dark:text-[#E8F0EA]">
                      Phone Number
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

                  {/* Secret Word */}
                  <div>
                    <label htmlFor="secretWord" className="mb-1.5 block text-sm font-medium text-[#1B3A20] dark:text-[#E8F0EA]">
                      Secret Word or Phrase
                    </label>
                    <input
                      id="secretWord"
                      type="text"
                      value={secretWord}
                      onChange={(e) => setSecretWord(e.target.value)}
                      placeholder="e.g. your dog's name, maiden name..."
                      className="w-full rounded-xl border border-[#D8D5CC] bg-white px-4 py-3.5 text-[0.95rem] text-[#1B3A20] placeholder:text-[#B0ADA5] focus:border-[#3A7D44] focus:outline-none focus:ring-2 focus:ring-[#3A7D44]/20 dark:border-[#2A3D2E] dark:bg-[#162018] dark:text-[#E8F0EA] dark:placeholder:text-[#4A6A50] dark:focus:border-[#5CB86A] dark:focus:ring-[#5CB86A]/20"
                    />
                    <p className="mt-1.5 text-xs text-[#8A9E8F] dark:text-[#6A8A70]">
                      A personal phrase for account recovery
                    </p>
                  </div>

                  {/* Continue */}
                  <button
                    onClick={handleDetailsContinue}
                    disabled={!detailsValid}
                    className="w-full rounded-xl bg-[#3A7D44] px-4 py-4 text-[0.95rem] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 dark:bg-[#5CB86A] dark:text-[#0F1A12]"
                  >
                    Continue
                  </button>
                </div>

                {/* Divider */}
                <div className="relative py-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#D8D5CC] dark:border-[#2A3D2E]" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-[#F7F5EE] px-3 text-[#8A9E8F] dark:bg-[#0F1A12] dark:text-[#6A8A70]">or sign up with</span>
                  </div>
                </div>

                {/* Google + Facebook */}
                <div className="space-y-3">
                  <button
                    onClick={handleGoogleSignUp}
                    disabled={isLoading}
                    className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#D8D5CC] bg-white px-4 py-3.5 text-[0.95rem] font-medium text-[#1B3A20] transition-all hover:border-[#3A7D44] hover:shadow-sm disabled:opacity-50 dark:border-[#2A3D2E] dark:bg-[#162018] dark:text-[#E8F0EA] dark:hover:border-[#5CB86A]"
                  >
                    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Sign up with Google
                  </button>
                  <button
                    onClick={handleFacebookSignUp}
                    disabled={isLoading}
                    className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#D8D5CC] bg-white px-4 py-3.5 text-[0.95rem] font-medium text-[#1B3A20] transition-all hover:border-[#3A7D44] hover:shadow-sm disabled:opacity-50 dark:border-[#2A3D2E] dark:bg-[#162018] dark:text-[#E8F0EA] dark:hover:border-[#5CB86A]"
                  >
                    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Sign up with Facebook
                  </button>
                </div>

                {/* Sign in link */}
                <div className="mt-6 text-center">
                  <p className="text-[0.95rem] text-[#8A9E8F] dark:text-[#6A8A70]">
                    Already have an account?{" "}
                    <Link href="/login" className="font-semibold text-[#3A7D44] hover:underline dark:text-[#5CB86A]">
                      Sign in
                    </Link>
                  </p>
                </div>
              </motion.div>
            )}

            {/* ═══ STEP 2 — KYC ═══ */}
            {step === "kyc" && (
              <motion.div
                key="kyc"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: easeOutExpo }}
              >
                <h1 className="text-[2rem] font-bold leading-[1.02] text-[#1B3A20] dark:text-[#E8F0EA] sm:text-[2.5rem]">
                  Almost there
                </h1>
                <p className="mt-3 text-lg text-[#5A7A60] dark:text-[#9AB0A0]">
                  Tell us about your farm so we can set up your account.
                </p>

                {/* Region */}
                <div className="mt-8">
                  <label className="mb-3 block text-sm font-semibold text-[#1B3A20] dark:text-[#E8F0EA]">
                    Where do you farm?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {regions.map((r) => (
                      <button
                        key={r.code}
                        onClick={() => setRegion(r.code)}
                        className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm transition-all ${
                          region === r.code
                            ? "border-[#3A7D44] bg-[#3A7D44]/5 font-semibold dark:border-[#5CB86A] dark:bg-[#5CB86A]/5"
                            : "border-[#D8D5CC] bg-white hover:border-[#3A7D44]/40 dark:border-[#2A3D2E] dark:bg-[#162018] dark:hover:border-[#5CB86A]/40"
                        }`}
                      >
                        <Globe className="h-4 w-4 shrink-0 text-[#8A9E8F] dark:text-[#6A8A70]" />
                        <div>
                          <p className="font-medium text-[#1B3A20] dark:text-[#E8F0EA]">{r.label}</p>
                          <p className="text-xs text-[#8A9E8F] dark:text-[#6A8A70]">{r.code}</p>
                        </div>
                        {region === r.code && (
                          <Check className="ml-auto h-4 w-4 text-[#3A7D44] dark:text-[#5CB86A]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Crop */}
                <div className="mt-6">
                  <label className="mb-3 block text-sm font-semibold text-[#1B3A20] dark:text-[#E8F0EA]">
                    What do you grow?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {crops.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setCrop(c.id)}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3.5 text-sm transition-all ${
                          crop === c.id
                            ? "border-[#3A7D44] bg-[#3A7D44]/5 font-semibold dark:border-[#5CB86A] dark:bg-[#5CB86A]/5"
                            : "border-[#D8D5CC] bg-white hover:border-[#3A7D44]/40 dark:border-[#2A3D2E] dark:bg-[#162018] dark:hover:border-[#5CB86A]/40"
                        }`}
                      >
                        <span className="text-2xl">{c.icon}</span>
                        {c.label}
                        {crop === c.id && (
                          <Check className="h-3.5 w-3.5 text-[#3A7D44] dark:text-[#5CB86A]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-8 flex items-center justify-between gap-4">
                  <button
                    onClick={() => setStep("details")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#D8D5CC] bg-white px-5 py-3 text-sm font-semibold text-[#5A7A60] transition-colors hover:bg-[#F0FAF2] dark:border-[#2A3D2E] dark:bg-[#162018] dark:text-[#9AB0A0] dark:hover:bg-[#1A2A1E]"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={isLoading || !kycValid}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#3A7D44] px-6 py-3 text-[0.95rem] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 dark:bg-[#5CB86A] dark:text-[#0F1A12]"
                  >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Account"}
                    {!isLoading && <ChevronRight className="h-4 w-4" />}
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
        </div>
      </div>
    </div>
  );
}
