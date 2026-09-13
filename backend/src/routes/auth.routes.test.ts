import { describe, it, expect, beforeEach } from 'vitest';
import { buildServer } from '../app.js';
import { resetAuthStores } from '../services/auth.service.js';

// Unique wallet addresses per test to avoid in-memory store leakage.
let walletCounter = 0;
function fakeWallet(): string {
  walletCounter++;
  const suffix = walletCounter.toString().padStart(55, '0');
  return `G${suffix.toUpperCase()}`;
}

describe('Auth routes', () => {
  let server: Awaited<ReturnType<typeof buildServer>>;

  beforeEach(async () => {
    walletCounter = 0;
    resetAuthStores();
    server = await buildServer();
    await server.ready();
  });

  // ── Farmer Registration ────────────────────────────────────────────────

  describe('POST /auth/farmer/register', () => {
    const validBody = {
      provider: 'google',
      providerSubject: 'google-oauth-sub-123',
      name: 'Adewale Okafor',
      region: 'NG-OYO',
      crop: 'MAIZE',
      secretWord: 'secure-phrase',
    };

    it('registers a new farmer and returns wallet address', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/auth/farmer/register',
        payload: validBody,
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.farmerId).toBeDefined();
      expect(body.data.walletAddress).toMatch(/^G[A-Z0-9]{55}$/);
      expect(body.data.isNew).toBe(true);
    });

    it('returns existing farmer on duplicate registration', async () => {
      await server.inject({ method: 'POST', url: '/auth/farmer/register', payload: validBody });
      const res = await server.inject({ method: 'POST', url: '/auth/farmer/register', payload: validBody });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.payload);
      expect(body.data.isNew).toBe(false);
    });

    it('rejects invalid provider', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/auth/farmer/register',
        payload: { ...validBody, provider: 'twitter' },
      });

      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(false);
      expect(body.error).toContain('provider');
    });

    it('rejects missing name', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/auth/farmer/register',
        payload: { ...validBody, name: '' },
      });

      expect(res.statusCode).toBe(400);
    });

    it('rejects invalid region format', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/auth/farmer/register',
        payload: { ...validBody, region: 'invalid' },
      });

      expect(res.statusCode).toBe(400);
    });

    it('rejects invalid crop', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/auth/farmer/register',
        payload: { ...validBody, crop: 'BANANA' },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  // ── Farmer Login ───────────────────────────────────────────────────────

  describe('POST /auth/farmer/login', () => {
    it('logs in a registered farmer and returns session token', async () => {
      await server.inject({
        method: 'POST',
        url: '/auth/farmer/register',
        payload: {
          provider: 'google',
          providerSubject: 'google-sub-login-test',
           name: 'Test Farmer',
           region: 'NG-OYO',
           crop: 'MAIZE',
           secretWord: 'secure-phrase',
        },
      });

      const res = await server.inject({
        method: 'POST',
        url: '/auth/farmer/login',
        payload: { provider: 'google', providerSubject: 'google-sub-login-test', secretWord: 'secure-phrase' },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.farmerId).toBeDefined();
      expect(body.data.walletAddress).toMatch(/^G[A-Z0-9]{55}$/);
      expect(body.data.sessionToken).toBeDefined();
      expect(body.data.sessionToken.split('.')).toHaveLength(3);
    });

    it('returns 404 for unregistered farmer', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/auth/farmer/login',
        payload: { provider: 'google', providerSubject: 'nonexistent', secretWord: 'secure-phrase' },
      });

      expect(res.statusCode).toBe(404);
    });
  });

  // ── Farmer Profile ─────────────────────────────────────────────────────

  describe('GET /farmer/me', () => {
    it('returns farmer profile with valid token', async () => {
      await server.inject({
        method: 'POST',
        url: '/auth/farmer/register',
        payload: {
          provider: 'phone',
          providerSubject: 'phone-me-test',
           name: 'Kemi Adekunle',
           region: 'NG-ON',
           crop: 'COCOA',
           secretWord: 'secure-phrase',
        },
      });

      const loginRes = await server.inject({
        method: 'POST',
        url: '/auth/farmer/login',
        payload: { provider: 'phone', providerSubject: 'phone-me-test', secretWord: 'secure-phrase' },
      });
      const loginBody = JSON.parse(loginRes.payload);

      const profileRes = await server.inject({
        method: 'GET',
        url: '/farmer/me',
        headers: { authorization: `Bearer ${loginBody.data.sessionToken}` },
      });

      expect(profileRes.statusCode).toBe(200);
      const body = JSON.parse(profileRes.payload);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('Kemi Adekunle');
      expect(body.data.region).toBe('NG-ON');
      expect(body.data.crop).toBe('COCOA');
      expect(body.data.walletAddress).toMatch(/^G[A-Z0-9]{55}$/);
    });

    it('returns 401 without auth token', async () => {
      const res = await server.inject({ method: 'GET', url: '/farmer/me' });
      expect(res.statusCode).toBe(401);
    });

    it('returns 401 with invalid token', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/farmer/me',
        headers: { authorization: 'Bearer invalid.token.here' },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ── Lender Onboarding ──────────────────────────────────────────────────

  describe('POST /auth/lender/onboard', () => {
    it('onboards a new lender and returns session token', async () => {
      const wallet = fakeWallet();
      const res = await server.inject({
        method: 'POST',
        url: '/auth/lender/onboard',
        payload: { walletAddress: wallet },
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.lenderId).toBeDefined();
      expect(body.data.walletAddress).toBe(wallet);
      expect(body.data.kycStatus).toBe('pending');
      expect(body.data.sessionToken).toBeDefined();
    });

    it('returns existing lender on duplicate onboarding', async () => {
      const wallet = fakeWallet();
      await server.inject({ method: 'POST', url: '/auth/lender/onboard', payload: { walletAddress: wallet } });
      const res = await server.inject({ method: 'POST', url: '/auth/lender/onboard', payload: { walletAddress: wallet } });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.payload);
      expect(body.data.kycStatus).toBe('pending');
    });

    it('rejects invalid wallet address', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/auth/lender/onboard',
        payload: { walletAddress: 'NOT-A-VALID-ADDRESS' },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  // ── Lender Login ───────────────────────────────────────────────────────

  describe('POST /auth/lender/login', () => {
    it('logs in an onboarded lender', async () => {
      const wallet = fakeWallet();
      await server.inject({ method: 'POST', url: '/auth/lender/onboard', payload: { walletAddress: wallet } });

      const res = await server.inject({
        method: 'POST',
        url: '/auth/lender/login',
        payload: { walletAddress: wallet },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data.lenderId).toBeDefined();
      expect(body.data.sessionToken).toBeDefined();
    });

    it('returns 404 for unknown wallet', async () => {
      const wallet = fakeWallet();
      const res = await server.inject({
        method: 'POST',
        url: '/auth/lender/login',
        payload: { walletAddress: wallet },
      });

      expect(res.statusCode).toBe(404);
    });
  });

  // ── Lender KYC ─────────────────────────────────────────────────────────

  describe('POST /auth/lender/kyc', () => {
    it('submits KYC for an onboarded lender', async () => {
      const wallet = fakeWallet();
      const onboardRes = await server.inject({ method: 'POST', url: '/auth/lender/onboard', payload: { walletAddress: wallet } });
      const onboardBody = JSON.parse(onboardRes.payload);

      const res = await server.inject({
        method: 'POST',
        url: '/auth/lender/kyc',
        headers: { authorization: `Bearer ${onboardBody.data.sessionToken}` },
        payload: { fullName: 'Adewale Capital', entityType: 'Impact Fund', email: 'kyc@example.com', country: 'Nigeria' },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data.kycStatus).toBe('pending');
    });

    it('returns 404 for unknown wallet', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/auth/lender/kyc',
        payload: { fullName: 'Unknown', entityType: 'Impact Fund', email: 'kyc@example.com', country: 'Nigeria' },
      });

      expect(res.statusCode).toBe(401);
    });
  });

  // ── Lender Profile ─────────────────────────────────────────────────────

  describe('GET /lender/me', () => {
    it('returns lender profile with valid token', async () => {
      const wallet = fakeWallet();
      const onboardRes = await server.inject({
        method: 'POST',
        url: '/auth/lender/onboard',
        payload: { walletAddress: wallet },
      });
      const onboardBody = JSON.parse(onboardRes.payload);

      const profileRes = await server.inject({
        method: 'GET',
        url: '/lender/me',
        headers: { authorization: `Bearer ${onboardBody.data.sessionToken}` },
      });

      expect(profileRes.statusCode).toBe(200);
      const body = JSON.parse(profileRes.payload);
      expect(body.data.walletAddress).toBe(wallet);
      expect(body.data.kycStatus).toBe('pending');
    });

    it('returns 401 without auth token', async () => {
      const res = await server.inject({ method: 'GET', url: '/lender/me' });
      expect(res.statusCode).toBe(401);
    });
  });
});
