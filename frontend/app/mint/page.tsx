"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Leaf, Wallet, CheckCircle2, XCircle, Loader2, Copy, ExternalLink } from "lucide-react";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { useFreighter } from "../hooks/useFreighter";
import { mintVyc, MintVycParams, SOROBAN_CONFIG } from "../services/soroban";

export default function MintPage() {
  const router = useRouter();
  const { address, isConnected, isLoading: walletLoading, error: walletError, connect } = useFreighter();

  const [formData, setFormData] = useState({
    score: "",
    expectedYield: "",
    crop: "MAIZE",
    region: "NG-OYO",
    activityHash: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mintResult, setMintResult] = useState<{
    success: boolean;
    vycId?: string;
    txHash?: string;
    error?: string;
  } | null>(null);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.score || isNaN(Number(formData.score))) {
      errors.score = "Please enter a valid score";
    } else if (Number(formData.score) < 0 || Number(formData.score) > 100) {
      errors.score = "Score must be between 0 and 100";
    }

    if (!formData.expectedYield || isNaN(Number(formData.expectedYield))) {
      errors.expectedYield = "Please enter a valid expected yield";
    } else if (Number(formData.expectedYield) <= 0) {
      errors.expectedYield = "Expected yield must be greater than 0";
    }

    if (!formData.activityHash || formData.activityHash.length < 32) {
      errors.activityHash = "Activity hash must be at least 32 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!isConnected || !address) {
      alert("Please connect your wallet first");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setMintResult(null);

    try {
      // Convert expected yield to micro-USDC (multiply by 1,000,000)
      const expectedYieldMicroUsdc = (Number(formData.expectedYield) * 1_000_000).toString();

      const params: MintVycParams = {
        adminAddress: address, // In production, this would be a backend-controlled admin key
        farmerAddress: address,
        score: Number(formData.score),
        expectedYield: expectedYieldMicroUsdc,
        crop: formData.crop,
        region: formData.region,
        activityHash: formData.activityHash,
      };

      const result = await mintVyc(params);
      setMintResult(result);

      if (result.success) {
        // Reset form after successful mint
        setFormData({
          score: "",
          expectedYield: "",
          crop: "MAIZE",
          region: "NG-OYO",
          activityHash: "",
        });
      }
    } catch (error) {
      setMintResult({
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStellarExpertUrl = (txHash: string): string => {
    const network = SOROBAN_CONFIG.NETWORK_PASSPHRASE.includes("Test") ? "testnet" : "public";
    return `https://stellar.expert/explorer/${network}/tx/${txHash}`;
  };

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Leaf className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Mint Verifiable Yield Certificate</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Create an on-chain certificate for your expected harvest
              </p>
            </div>
          </div>
        </div>

        {/* Wallet Connection Section */}
        <div className="mb-8 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Freighter Wallet</p>
                {isConnected && address ? (
                  <p className="text-xs text-muted-foreground font-mono">
                    {address.slice(0, 8)}...{address.slice(-8)}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">Not connected</p>
                )}
              </div>
            </div>
            <div>
              {!isConnected ? (
                <button
                  onClick={connect}
                  disabled={walletLoading}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {walletLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    "Connect Wallet"
                  )}
                </button>
              ) : (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Connected
                </div>
              )}
            </div>
          </div>
          {walletError && (
            <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {walletError}
            </div>
          )}
        </div>

        {/* Minting Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Certificate Details</h2>
            </div>

            {/* Score */}
            <div>
              <label htmlFor="score" className="block text-sm font-medium mb-2">
                Trust Score (0-100) <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                id="score"
                min="0"
                max="100"
                value={formData.score}
                onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="82"
                disabled={!isConnected || isSubmitting}
              />
              {formErrors.score && (
                <p className="mt-1 text-xs text-destructive">{formErrors.score}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                AgriTrust credit score based on verified farming activity
              </p>
            </div>

            {/* Expected Yield */}
            <div>
              <label htmlFor="expectedYield" className="block text-sm font-medium mb-2">
                Expected Harvest Value (USDC) <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                id="expectedYield"
                min="0"
                step="0.01"
                value={formData.expectedYield}
                onChange={(e) => setFormData({ ...formData, expectedYield: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="45.00"
                disabled={!isConnected || isSubmitting}
              />
              {formErrors.expectedYield && (
                <p className="mt-1 text-xs text-destructive">{formErrors.expectedYield}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                Expected harvest value in USDC (e.g., 45 = $45 USDC)
              </p>
            </div>

            {/* Crop */}
            <div>
              <label htmlFor="crop" className="block text-sm font-medium mb-2">
                Crop Type <span className="text-destructive">*</span>
              </label>
              <select
                id="crop"
                value={formData.crop}
                onChange={(e) => setFormData({ ...formData, crop: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={!isConnected || isSubmitting}
              >
                <option value="MAIZE">Maize</option>
                <option value="COCOA">Cocoa</option>
                <option value="RICE">Rice</option>
                <option value="SOYBEAN">Soybean</option>
                <option value="CASSAVA">Cassava</option>
                <option value="YAM">Yam</option>
              </select>
            </div>

            {/* Region */}
            <div>
              <label htmlFor="region" className="block text-sm font-medium mb-2">
                Region <span className="text-destructive">*</span>
              </label>
              <select
                id="region"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={!isConnected || isSubmitting}
              >
                <option value="NG-OYO">NG-OYO (Oyo, Nigeria)</option>
                <option value="NG-LA">NG-LA (Lagos, Nigeria)</option>
                <option value="NG-KW">NG-KW (Kwara, Nigeria)</option>
                <option value="NG-ON">NG-ON (Ondo, Nigeria)</option>
                <option value="NG-EB">NG-EB (Ebonyi, Nigeria)</option>
                <option value="NG-KD">NG-KD (Kaduna, Nigeria)</option>
              </select>
            </div>

            {/* Activity Hash */}
            <div>
              <label htmlFor="activityHash" className="block text-sm font-medium mb-2">
                Activity Hash (SHA-256) <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                id="activityHash"
                value={formData.activityHash}
                onChange={(e) => setFormData({ ...formData, activityHash: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="9f2c41d1e8b71a0c66e3d2f9b84a1c07e5d6a3b8c42e9f1a7d0c5b6a8e3f2d91"
                disabled={!isConnected || isSubmitting}
              />
              {formErrors.activityHash && (
                <p className="mt-1 text-xs text-destructive">{formErrors.activityHash}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                SHA-256 hash of proof-of-activity payload (seed purchase, planting log, etc.)
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isConnected || isSubmitting}
            className="w-full rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Minting Certificate...
              </span>
            ) : (
              "Mint VYC Certificate"
            )}
          </button>
        </form>

        {/* Result Display */}
        {mintResult && (
          <div
            className={`mt-6 rounded-2xl border p-6 ${
              mintResult.success
                ? "border-emerald-500/50 bg-emerald-500/5"
                : "border-destructive/50 bg-destructive/5"
            }`}
          >
            <div className="flex items-start gap-3">
              {mintResult.success ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold mb-2">
                  {mintResult.success ? "Certificate Minted Successfully!" : "Minting Failed"}
                </h3>
                {mintResult.success ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Certificate ID:</p>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-background px-2 py-1 rounded">
                          {mintResult.vycId}
                        </code>
                        <button
                          onClick={() => copyToClipboard(mintResult.vycId!)}
                          className="p-1 hover:bg-background rounded transition-colors"
                          title="Copy to clipboard"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {mintResult.txHash && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Transaction Hash:</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="text-sm font-mono bg-background px-2 py-1 rounded break-all">
                            {mintResult.txHash}
                          </code>
                          <button
                            onClick={() => copyToClipboard(mintResult.txHash!)}
                            className="p-1 hover:bg-background rounded transition-colors"
                            title="Copy to clipboard"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <a
                            href={getStellarExpertUrl(mintResult.txHash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            View on Stellar Expert
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => router.push("/dashboard")}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                    >
                      View My Certificates
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-destructive">{mintResult.error}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
