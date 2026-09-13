import Fastify from 'fastify';
import cors from '@fastify/cors';
import { appConfig } from './config/app.config.js';
import { registerAdminRoutes } from './routes/admin.routes.js';
import { registerAuthRoutes } from './routes/auth.routes.js';
import { healthRoute } from './routes/health.routes.js';
import { registerActivityRoutes } from './routes/activity.routes.js';
import { registerScoreRoutes } from './routes/score.routes.js';
import { registerVycRoutes } from './routes/vyc.routes.js';
import { logger } from './utils/logger.js';

export async function buildServer() {
  const fastify = Fastify({
    logger: false,
  });

  await fastify.register(cors, {
    origin: true,
  });

  fastify.get('/', async () => ({
    name: 'AgriTrust Backend',
    description: 'VYC issuing, credit scoring, and on-chain relay for the AgriTrust Protocol.',
    status: 'ok',
    network: appConfig.stellarNetwork,
    endpoints: {
      health: 'GET /health',
      score: 'POST /score  body: { farmer?, activities }',
      vycById: 'GET /vyc/:id?source=',
      vycCount: 'GET /vyc/count?source=',
      farmerVycs: 'GET /farmer/:account/vycs?source=',
      contractEvents: 'GET /vyc/events?startLedger=&cursor=&limit=',
      adminMint:
        'POST /admin/vyc/mint  body: { farmer, expectedYield, crop, region, score? | activities?, activityHash?, dryRun? }',
      adminStatus: 'POST /admin/vyc/:id/status  body: { status, dryRun? }',
      farmerRegister: 'POST /auth/farmer/register  body: { provider, providerSubject, name, region, crop }',
      farmerLogin: 'POST /auth/farmer/login  body: { provider, providerSubject }',
      farmerProfile: 'GET /farmer/me  (auth: Bearer token)',
      lenderOnboard: 'POST /auth/lender/onboard  body: { walletAddress }',
      lenderLogin: 'POST /auth/lender/login  body: { walletAddress }',
       lenderKyc: 'POST /auth/lender/kyc  auth: Bearer token  body: { fullName, entityType, email, country }',
      lenderProfile: 'GET /lender/me  (auth: Bearer token)',
    },
    docs: 'See backend/README.md in the repo for full usage.',
  }));

  fastify.get('/health', healthRoute);
  await registerActivityRoutes(fastify);
  await registerVycRoutes(fastify);
  await registerScoreRoutes(fastify);
  await registerAdminRoutes(fastify);
  await registerAuthRoutes(fastify);

  fastify.setErrorHandler((error, _request, reply) => {
    logger.error({ error }, 'Unhandled error');

    const err = error as { statusCode?: number; message?: string };
    const statusCode = err.statusCode || 500;
    reply.code(statusCode).send({
      success: false,
      error: statusCode === 500 ? 'Internal server error' : err.message,
    });
  });

  return fastify;
}

export async function startServer() {
  const fastify = await buildServer();

  try {
    await fastify.listen({ port: appConfig.port, host: '0.0.0.0' });
    logger.info(`AgriTrust Backend running on http://0.0.0.0:${appConfig.port}`);
    logger.info(`Network: ${appConfig.stellarNetwork}`);
  } catch (err) {
    logger.error(err, 'Failed to start server');
    process.exit(1);
  }

  return fastify;
}

if (process.env.NODE_ENV !== 'test') {
  startServer().catch((err) => {
    logger.error(err, 'Failed to start server');
    process.exit(1);
  });
}
