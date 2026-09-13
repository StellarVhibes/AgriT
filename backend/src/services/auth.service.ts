import { Keypair } from '@stellar/stellar-sdk';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { AuthProvider, FarmerProfile, KycSubmission, LenderProfile, KycStatus } from '../types/auth.types.js';
import { AUTH_PROVIDERS, KYC_STATUSES } from '../types/auth.types.js';
import { logger } from '../utils/logger.js';

// ─── In-memory stores ──────────────────────────────────────────────────────
// Same pattern as activity.service.ts — swap for a real DB later.

const farmerStore = new Map<string, FarmerProfile>();
const lenderStore = new Map<string, LenderProfile>();
const lenderByWallet = new Map<string, string>(); // walletAddress → lenderId

// ─── Helpers ───────────────────────────────────────────────────────────────

function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Encrypt a Stellar seed for storage. In production this should use a proper
 * KMS (e.g. AWS KMS envelope encryption). For testnet/demo we use a simple
 * XOR-based obfuscation with a derived key — NOT production-safe.
 */
function encryptSeed(seed: string): string {
  const key = process.env.SEED_ENCRYPTION_KEY || 'dev-only-not-production-safe!!';
  const keyBytes = Buffer.from(key.padEnd(32, '!').slice(0, 32));
  const seedBytes = Buffer.from(seed);
  const encrypted = Buffer.alloc(seedBytes.length);
  for (let i = 0; i < seedBytes.length; i++) {
    encrypted[i] = seedBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  return encrypted.toString('base64');
}

/**
 * Decrypt a stored seed back to plaintext. Only used server-side when
 * signing transactions for custodial wallets.
 */
export function decryptSeed(encryptedSeed: string): string {
  const key = process.env.SEED_ENCRYPTION_KEY || 'dev-only-not-production-safe!!';
  const keyBytes = Buffer.from(key.padEnd(32, '!').slice(0, 32));
  const encryptedBytes = Buffer.from(encryptedSeed, 'base64');
  const decrypted = Buffer.alloc(encryptedBytes.length);
  for (let i = 0; i < encryptedBytes.length; i++) {
    decrypted[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  return decrypted.toString();
}

/**
 * Fund a testnet account via Stellar friendbot.
 * Silently succeeds on mainnet (funding is out-of-band there).
 */
async function fundTestnetAccount(address: string): Promise<void> {
  const network = process.env.STELLAR_NETWORK || 'testnet';
  if (network !== 'testnet') return;
  if (process.env.NODE_ENV === 'test') return; // skip in tests

  try {
    const url = `https://friendbot.stellar.org?addr=${encodeURIComponent(address)}`;
    const response = await fetch(url);
    if (!response.ok) {
      logger.warn({ address, status: response.status }, 'Friendbot funding failed (non-fatal)');
    }
  } catch (err) {
    logger.warn({ address, error: (err as Error).message }, 'Friendbot request failed (non-fatal)');
  }
}

// ─── Farmer auth ───────────────────────────────────────────────────────────

export interface RegisterFarmerInput {
  provider: AuthProvider;
  providerSubject: string;
  name: string;
  region: string;
  crop: string;
  secretWord: string;
}

export interface RegisterFarmerResult {
  farmerId: string;
  walletAddress: string;
  isNew: boolean;
  sessionToken: string;
}

function hashSecret(secret: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(secret, salt, 32);
  return `${salt.toString('base64')}.${hash.toString('base64')}`;
}

function verifySecret(secret: string, encoded: string): boolean {
  const [saltText, hashText] = encoded.split('.');
  if (!saltText || !hashText) return false;

  const expected = Buffer.from(hashText, 'base64');
  const actual = scryptSync(secret, Buffer.from(saltText, 'base64'), expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/**
 * Register a new farmer or return existing profile.
 * Generates a custodial Stellar keypair on first registration.
 */
export async function registerFarmer(input: RegisterFarmerInput): Promise<RegisterFarmerResult> {
  const compositeKey = `${input.provider}:${input.providerSubject}`;
  const existing = farmerStore.get(compositeKey);

  if (existing) {
    const sessionToken = await generateSessionToken(existing.id, 'farmer');
    return {
      farmerId: existing.id,
      walletAddress: existing.walletAddress,
      isNew: false,
      sessionToken,
    };
  }

  // Generate a new Stellar keypair for the farmer
  const keypair = Keypair.random();
  const publicKey = keypair.publicKey();
  const seed = keypair.secret();

  const farmer: FarmerProfile = {
    id: generateId(),
    provider: input.provider,
    providerSubject: input.providerSubject,
    name: input.name,
    region: input.region,
    crop: input.crop,
    walletAddress: publicKey,
    secretWordHash: hashSecret(input.secretWord),
    walletEncryptedSeed: encryptSeed(seed),
    createdAt: new Date().toISOString(),
  };

  farmerStore.set(compositeKey, farmer);

  // Fund on testnet (non-blocking — farmer can start using the app immediately)
  await fundTestnetAccount(publicKey);

  logger.info({ farmerId: farmer.id, walletAddress: publicKey }, 'Farmer registered');

  return {
    farmerId: farmer.id,
    walletAddress: publicKey,
    isNew: true,
    sessionToken: await generateSessionToken(farmer.id, 'farmer'),
  };
}

export interface LoginFarmerInput {
  provider: AuthProvider;
  providerSubject: string;
  secretWord: string;
}

export interface LoginFarmerResult {
  farmerId: string;
  walletAddress: string;
  sessionToken: string;
}

/**
 * Login an existing farmer. Returns a JWT session token.
 * Returns null if the farmer is not registered.
 */
export async function loginFarmer(input: LoginFarmerInput): Promise<LoginFarmerResult | null> {
  const compositeKey = `${input.provider}:${input.providerSubject}`;
  const farmer = farmerStore.get(compositeKey);

  if (!farmer || !verifySecret(input.secretWord, farmer.secretWordHash)) return null;

  const token = await generateSessionToken(farmer.id, 'farmer');

  return {
    farmerId: farmer.id,
    walletAddress: farmer.walletAddress,
    sessionToken: token,
  };
}

/**
 * Get a farmer's profile by ID. Returns null if not found.
 */
export function getFarmerProfile(farmerId: string): FarmerProfile | null {
  for (const farmer of farmerStore.values()) {
    if (farmer.id === farmerId) return farmer;
  }
  return null;
}

/**
 * Get a farmer's VYC IDs from the on-chain contract.
 * This is a placeholder — in production, call the Soroban contract.
 */
export function getFarmerVycIds(_farmerId: string): number[] {
  // TODO: call contract.get_farmer_vycs(farmer wallet address)
  return [];
}

// ─── Lender auth ───────────────────────────────────────────────────────────

export interface OnboardLenderInput {
  walletAddress: string;
}

export interface OnboardLenderResult {
  lenderId: string;
  walletAddress: string;
  kycStatus: KycStatus;
}

/**
 * Onboard a new lender or return existing profile.
 * Lenders use self-custody wallets — no keypair generation.
 */
export function onboardLender(input: OnboardLenderInput): OnboardLenderResult {
  const existingId = lenderByWallet.get(input.walletAddress);
  if (existingId) {
    const existing = lenderStore.get(existingId)!;
    return {
      lenderId: existing.id,
      walletAddress: existing.walletAddress,
      kycStatus: existing.kycStatus,
    };
  }

  const lender: LenderProfile = {
    id: generateId(),
    walletAddress: input.walletAddress,
    kycStatus: 'pending',
    createdAt: new Date().toISOString(),
  };

  lenderStore.set(lender.id, lender);
  lenderByWallet.set(input.walletAddress, lender.id);

  logger.info({ lenderId: lender.id, walletAddress: input.walletAddress }, 'Lender onboarded');

  return {
    lenderId: lender.id,
    walletAddress: input.walletAddress,
    kycStatus: 'pending',
  };
}

/**
 * Submit or update KYC status for a lender.
 */
export function updateLenderKyc(
  walletAddress: string,
  status: KycStatus,
  kycSubmission?: KycSubmission,
): LenderProfile | null {
  const lenderId = lenderByWallet.get(walletAddress);
  if (!lenderId) return null;

  const lender = lenderStore.get(lenderId);
  if (!lender) return null;

  lender.kycStatus = status;
  if (kycSubmission) lender.kycSubmission = kycSubmission;

  logger.info({ lenderId: lender.id, status }, 'Lender KYC updated');

  return lender;
}

/**
 * Get a lender's profile by lender ID. Returns null if not found.
 */
export function getLenderProfile(lenderId: string): LenderProfile | null {
  return lenderStore.get(lenderId) ?? null;
}

/**
 * Get a lender's ID by wallet address. Returns null if not found.
 */
export function getLenderIdByWallet(walletAddress: string): string | null {
  return lenderByWallet.get(walletAddress) ?? null;
}

// ─── JWT session tokens ────────────────────────────────────────────────────
// Lightweight HMAC-SHA256 JWT using Web Crypto API (no external deps).
// For production, use a proper JWT library with key rotation.

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-not-for-production';
const TOKEN_EXPIRY_SECONDS = 24 * 60 * 60; // 24 hours

function base64url(data: Buffer | Uint8Array | string): string {
  let buf: Buffer;
  if (typeof data === 'string') {
    buf = Buffer.from(data, 'utf-8');
  } else if (data instanceof Uint8Array && !(data instanceof Buffer)) {
    buf = Buffer.from(data);
  } else {
    buf = data as Buffer;
  }
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str: string): Buffer {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return Buffer.from(base64, 'base64');
}

async function hmacSign(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return base64url(Buffer.from(signature));
}

async function hmacVerify(data: string, signature: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const sigBytes = base64urlDecode(signature);
  return crypto.subtle.verify('HMAC', key, new Uint8Array(sigBytes), encoder.encode(data));
}

export async function generateSessionToken(
  userId: string,
  role: 'farmer' | 'lender',
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload = { sub: userId, role, iat: now, exp: now + TOKEN_EXPIRY_SECONDS };

  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(payload));
  const signature = await hmacSign(`${header}.${body}`);

  return `${header}.${body}.${signature}`;
}

export async function verifySessionToken(
  token: string,
): Promise<{ sub: string; role: 'farmer' | 'lender' } | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;
    const valid = await hmacVerify(`${header}.${body}`, signature);
    if (!valid) return null;

    const payload = JSON.parse(base64urlDecode(body).toString());

    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;

    return { sub: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}

// ─── Test helpers ──────────────────────────────────────────────────────────
// Clears in-memory stores. Only for use in tests.

export function resetAuthStores(): void {
  farmerStore.clear();
  lenderStore.clear();
  lenderByWallet.clear();
}
