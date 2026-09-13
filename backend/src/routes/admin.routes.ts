import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { appConfig } from '../config/app.config.js';
import { createContractService } from '../services/contract.service.js';
import { historyService } from '../services/history.service.js';
import { computeAgriTrustScore, hashActivityPayload } from '../services/scoring.service.js';
import type { ActivityEntry, MintVycRequest, ScoreResult, VycStatus } from '../types/vyc.types.js';
import { VYC_STATUSES } from '../types/vyc.types.js';
import { isAddress, isHexHash, isValidCrop, isValidExpectedYield, isValidRegion } from '../utils/validators.js';

function isAuthorized(request: FastifyRequest): boolean {
  if (!appConfig.adminApiToken) return false;
  return request.headers['x-admin-token'] === appConfig.adminApiToken;
}

function unauthorised(reply: FastifyReply) {
  return reply.code(401).send({ success: false, error: 'Unauthorized — provide a valid x-admin-token header.' });
}

/**
 * Admin/backend-only endpoints. These hold the protocol admin keypair and
 * submit `mint_vyc` / `update_status` on-chain after proof-of-activity
 * verification and scoring. Guarded by the required ADMIN_API_TOKEN.
 */
export async function registerAdminRoutes(fastify: FastifyInstance) {
  const contractService = createContractService(appConfig.stellarNetwork);

  fastify.post<{ Body: MintVycRequest }>('/admin/vyc/mint', async (request, reply) => {
    if (!isAuthorized(request)) return unauthorised(reply);

    const body: MintVycRequest = request.body ?? {};

    if (!isAddress(body.farmer)) {
      return reply.code(400).send({ success: false, error: 'farmer must be a valid Stellar address.' });
    }
    if (!isValidCrop(body.crop)) {
      return reply.code(400).send({ success: false, error: 'crop is required (max 32 chars).' });
    }
    if (!isValidRegion(body.region)) {
      return reply.code(400).send({ success: false, error: 'region is required (ISO 3166-2, e.g. NG-LA).' });
    }
    if (!isValidExpectedYield(body.expectedYield)) {
      return reply.code(400).send({
        success: false,
        error: 'expectedYield is required and must be a positive integer of micro-USDC.',
      });
    }

    let computed: ScoreResult | null = null;
    if (Array.isArray(body.activities)) {
      computed = computeAgriTrustScore(body.activities as ActivityEntry[]);
    }

    let score = body.score;
    if (score === undefined) {
      if (!computed) {
        return reply.code(400).send({ success: false, error: 'score or activities must be provided.' });
      }
      score = computed.score;
    }
    if (!Number.isInteger(score) || score < 0 || score > 100) {
      return reply.code(400).send({ success: false, error: 'score must be an integer 0-100.' });
    }

    let activityHash = body.activityHash;
    if (activityHash === undefined) {
      const payload = typeof body.activityPayload === 'string' ? body.activityPayload : '';
      activityHash = computed ? computed.activityHash : hashActivityPayload(payload);
    }
    if (!isHexHash(activityHash)) {
      return reply.code(400).send({ success: false, error: 'activityHash must be a 64-char hex SHA-256.' });
    }

    const dryRun = body.dryRun === true;

    const result = await contractService.mintVyc(
      {
        farmer: body.farmer,
        score,
        expectedYield: body.expectedYield,
        crop: body.crop,
        region: body.region,
        activityHash,
      },
      { dryRun }
    );

    if (result.success && !dryRun) {
      historyService.recordMint({
        farmer: body.farmer,
        score,
        expectedYield: body.expectedYield,
        crop: body.crop,
        region: body.region,
        activityHash,
        status: 'Active',
        txHash: result.txHash,
      });
    }

    return result.success
      ? reply.send({ success: true, dryRun, score, activityHash, txHash: result.txHash })
      : reply.code(502).send(result);
  });

  fastify.post<{ Params: { id: string }; Body: { status?: string; dryRun?: boolean } }>(
    '/admin/vyc/:id/status',
    async (request, reply) => {
      if (!isAuthorized(request)) return unauthorised(reply);

      const id = parseInt(request.params.id, 10);
      if (!Number.isInteger(id) || id <= 0) {
        return reply.code(400).send({ success: false, error: 'Invalid VYC id — must be a positive integer.' });
      }

      const status = request.body?.status as VycStatus | undefined;
      if (!status || !(VYC_STATUSES as string[]).includes(status)) {
        return reply.code(400).send({ success: false, error: `status must be one of: ${VYC_STATUSES.join(', ')}.` });
      }

      const dryRun = request.body?.dryRun === true;
      const result = await contractService.updateStatus(id, status, { dryRun });

      if (result.success && !dryRun) {
        historyService.recordStatus(id, status, result.txHash);
      }

      return result.success
        ? reply.send({ success: true, id, status, dryRun, txHash: result.txHash })
        : reply.code(502).send(result);
    }
  );
}
