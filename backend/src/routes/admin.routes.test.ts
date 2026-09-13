import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildServer } from '../app.js';
import { appConfig } from '../config/app.config.js';

describe('Admin route authorization', () => {
  let server: Awaited<ReturnType<typeof buildServer>>;

  beforeEach(async () => {
    appConfig.adminApiToken = 'test-admin-token';
    server = await buildServer();
    await server.ready();
  });

  afterEach(async () => {
    await server.close();
    appConfig.adminApiToken = '';
  });

  it('rejects admin requests when the token is missing', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/admin/vyc/1/status',
      payload: { status: 'Redeemed' },
    });

    expect(response.statusCode).toBe(401);
  });

  it('rejects admin requests with an invalid token', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/admin/vyc/1/status',
      headers: { 'x-admin-token': 'wrong-token' },
      payload: { status: 'Redeemed' },
    });

    expect(response.statusCode).toBe(401);
  });
});
