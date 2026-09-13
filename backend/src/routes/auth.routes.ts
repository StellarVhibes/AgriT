import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { AuthProvider } from '../types/auth.types.js';
import { AUTH_PROVIDERS } from '../types/auth.types.js';
import {
  registerFarmer,
  loginFarmer,
  getFarmerProfile,
  getFarmerVycIds,
  onboardLender,
  updateLenderKyc,
  getLenderProfile,
  getLenderIdByWallet,
  generateSessionToken,
  verifySessionToken,
} from '../services/auth.service.js';
import { isAddress } from '../utils/validators.js';

// ─── Validators ────────────────────────────────────────────────────────────

const VALID_CROPS = ['MAIZE', 'COCOA', 'SOYBEAN', 'RICE', 'CASSAVA'];

function isValidProvider(v: unknown): v is AuthProvider {
  return typeof v === 'string' && (AUTH_PROVIDERS as readonly string[]).includes(v);
}

function isValidName(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length >= 1 && v.trim().length <= 100;
}

function isValidRegion(v: unknown): v is string {
  return typeof v === 'string' && /^[A-Z0-9-]{2,16}$/.test(v);
}

function isValidCrop(v: unknown): v is string {
  return typeof v === 'string' && VALID_CROPS.includes(v.toUpperCase());
}

// ─── Auth middleware ────────────────────────────────────────────────────────

async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.code(401).send({ success: false, error: 'Missing or invalid Authorization header.' });
  }

  const token = authHeader.slice(7);
  const payload = await verifySessionToken(token);
  if (!payload) {
    return reply.code(401).send({ success: false, error: 'Invalid or expired session token.' });
  }

  // Attach session info to request for downstream handlers
  (request as FastifyRequest & { session: { sub: string; role: string } }).session = payload;
}

// ─── Routes ────────────────────────────────────────────────────────────────

export async function registerAuthRoutes(fastify: FastifyInstance) {
  // ── Farmer Registration ────────────────────────────────────────────────

  fastify.post<{
    Body: {
      provider?: string;
      providerSubject?: string;
      name?: string;
      region?: string;
      crop?: string;
      secretWord?: string;
    };
  }>('/auth/farmer/register', async (request, reply) => {
    const body = request.body ?? {};

    // Validate required fields
    if (!isValidProvider(body.provider)) {
      return reply.code(400).send({
        success: false,
        error: `provider must be one of: ${AUTH_PROVIDERS.join(', ')}.`,
      });
    }
    if (typeof body.providerSubject !== 'string' || body.providerSubject.trim().length === 0) {
      return reply.code(400).send({ success: false, error: 'providerSubject is required.' });
    }
    if (!isValidName(body.name)) {
      return reply.code(400).send({ success: false, error: 'name must be 1-100 characters.' });
    }
    if (!isValidRegion(body.region)) {
      return reply.code(400).send({
        success: false,
        error: 'region must be a valid ISO 3166-2 code (e.g. NG-OYO).',
      });
    }
    if (!isValidCrop(body.crop)) {
      return reply.code(400).send({
        success: false,
        error: `crop must be one of: ${VALID_CROPS.join(', ')}.`,
      });
    }
    if (typeof body.secretWord !== 'string' || body.secretWord.trim().length < 2) {
      return reply.code(400).send({ success: false, error: 'secretWord must be at least 2 characters.' });
    }

    try {
      const result = await registerFarmer({
        provider: body.provider,
        providerSubject: body.providerSubject.trim(),
        name: body.name.trim(),
        region: body.region.toUpperCase(),
        crop: body.crop.toUpperCase(),
        secretWord: body.secretWord,
      });

      return reply.code(201).send({ success: true, data: result });
    } catch (err) {
      const message = (err as Error).message;
      return reply.code(500).send({ success: false, error: message });
    }
  });

  // ── Farmer Login ───────────────────────────────────────────────────────

  fastify.post<{
    Body: { provider?: string; providerSubject?: string; secretWord?: string };
  }>('/auth/farmer/login', async (request, reply) => {
    const body = request.body ?? {};

    if (!isValidProvider(body.provider)) {
      return reply.code(400).send({
        success: false,
        error: `provider must be one of: ${AUTH_PROVIDERS.join(', ')}.`,
      });
    }
    if (typeof body.providerSubject !== 'string' || body.providerSubject.trim().length === 0) {
      return reply.code(400).send({ success: false, error: 'providerSubject is required.' });
    }
    if (typeof body.secretWord !== 'string' || body.secretWord.trim().length < 2) {
      return reply.code(400).send({ success: false, error: 'secretWord must be at least 2 characters.' });
    }

    const result = await loginFarmer({
      provider: body.provider,
      providerSubject: body.providerSubject.trim(),
      secretWord: body.secretWord,
    });

    if (!result) {
      return reply.code(404).send({
        success: false,
        error: 'Farmer not found. Please register first.',
      });
    }

    return { success: true, data: result };
  });

  // ── Get Farmer Profile ─────────────────────────────────────────────────

  fastify.get('/farmer/me', { preHandler: [authenticate] }, async (request, reply) => {
    const session = (request as FastifyRequest & { session: { sub: string; role: string } }).session;

    if (session.role !== 'farmer') {
      return reply.code(403).send({ success: false, error: 'This endpoint is for farmers only.' });
    }

    const farmer = getFarmerProfile(session.sub);
    if (!farmer) {
      return reply.code(404).send({ success: false, error: 'Farmer profile not found.' });
    }

    const vycIds = getFarmerVycIds(farmer.id);

    return {
      success: true,
      data: {
        farmerId: farmer.id,
        name: farmer.name,
        region: farmer.region,
        crop: farmer.crop,
        walletAddress: farmer.walletAddress,
        vycIds,
      },
    };
  });

  // ── Lender Onboarding ──────────────────────────────────────────────────

  fastify.post<{
    Body: { walletAddress?: string };
  }>('/auth/lender/onboard', async (request, reply) => {
    const body = request.body ?? {};

    if (!isAddress(body.walletAddress)) {
      return reply.code(400).send({
        success: false,
        error: 'walletAddress must be a valid Stellar G... address.',
      });
    }

    const result = onboardLender({ walletAddress: body.walletAddress });

    const token = await generateSessionToken(result.lenderId, 'lender');

    return reply.code(201).send({
      success: true,
      data: { ...result, sessionToken: token },
    });
  });

  // ── Lender Login ───────────────────────────────────────────────────────

  fastify.post<{
    Body: { walletAddress?: string };
  }>('/auth/lender/login', async (request, reply) => {
    const body = request.body ?? {};

    if (!isAddress(body.walletAddress)) {
      return reply.code(400).send({
        success: false,
        error: 'walletAddress must be a valid Stellar G... address.',
      });
    }

    const lenderId = getLenderIdByWallet(body.walletAddress);

    if (!lenderId) {
      return reply.code(404).send({
        success: false,
        error: 'Lender not found. Please onboard first via POST /auth/lender/onboard.',
      });
    }

    const token = await generateSessionToken(lenderId, 'lender');

    return { success: true, data: { lenderId, sessionToken: token } };
  });

  // ── Lender KYC Submit ──────────────────────────────────────────────────

  fastify.post<{
    Body: {
      fullName?: string;
      entityType?: string;
      email?: string;
      country?: string;
    };
  }>('/auth/lender/kyc', { preHandler: [authenticate] }, async (request, reply) => {
    const session = (request as FastifyRequest & { session: { sub: string; role: string } }).session;
    if (session.role !== 'lender') {
      return reply.code(403).send({ success: false, error: 'This endpoint is for lenders only.' });
    }

    const body = request.body ?? {};
    if (
      typeof body.fullName !== 'string' ||
      typeof body.entityType !== 'string' ||
      typeof body.email !== 'string' ||
      typeof body.country !== 'string' ||
      !body.fullName.trim() ||
      !body.entityType.trim() ||
      !body.email.includes('@') ||
      !body.country.trim()
    ) {
      return reply.code(400).send({ success: false, error: 'Complete KYC details are required.' });
    }

    const lenderProfile = getLenderProfile(session.sub);
    const lender = lenderProfile
      ? updateLenderKyc(lenderProfile.walletAddress, 'pending', {
          fullName: body.fullName.trim(),
          entityType: body.entityType.trim(),
          email: body.email.trim(),
          country: body.country.trim(),
        })
      : null;
    if (!lender) {
      return reply.code(404).send({
        success: false,
        error: 'Lender not found. Please onboard first via POST /auth/lender/onboard.',
      });
    }

    return { success: true, data: { lenderId: lender.id, kycStatus: lender.kycStatus } };
  });

  // ── Get Lender Profile ─────────────────────────────────────────────────

  fastify.get('/lender/me', { preHandler: [authenticate] }, async (request, reply) => {
    const session = (request as FastifyRequest & { session: { sub: string; role: string } }).session;

    if (session.role !== 'lender') {
      return reply.code(403).send({ success: false, error: 'This endpoint is for lenders only.' });
    }

    const lender = getLenderProfile(session.sub);
    if (!lender) {
      return reply.code(404).send({ success: false, error: 'Lender profile not found.' });
    }

    return {
      success: true,
      data: {
        lenderId: lender.id,
        walletAddress: lender.walletAddress,
        kycStatus: lender.kycStatus,
      },
    };
  });
}
