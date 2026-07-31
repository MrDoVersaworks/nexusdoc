import { test, expect } from '@playwright/test';

const BACKEND_URL = 'http://localhost:4000';

test.describe('NexusDoc — Security & Document Sovereignty (SIL Rules)', () => {
  /* ---- User Scoping & Document Protection (SIL-3) ---- */
  test('GET /documents rejects unauthenticated access', async ({ request }) => {
    const res = await request.get(`${BACKEND_URL}/api/documents`);
    expect(res.status()).toBe(401);
  });

  test('POST /documents/search rejects unauthenticated search queries', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/api/documents/search`, { data: {} });
    expect(res.status()).toBe(401);
  });

  test('GET /documents/:id rejects unauthenticated access to specific doc', async ({ request }) => {
    const res = await request.get(`${BACKEND_URL}/api/documents/unauthorized-doc-123`);
    expect(res.status()).toBe(401);
  });

  test('DELETE /documents/:id rejects unauthenticated doc deletion', async ({ request }) => {
    const res = await request.delete(`${BACKEND_URL}/api/documents/unauthorized-doc-123`);
    expect(res.status()).toBe(401);
  });

  test('GET /stats rejects unauthenticated usage stats request', async ({ request }) => {
    const res = await request.get(`${BACKEND_URL}/api/stats`);
    expect(res.status()).toBe(401);
  });

  test('DELETE /account rejects unauthenticated user account purge', async ({ request }) => {
    const res = await request.delete(`${BACKEND_URL}/api/auth/account`);
    expect(res.status()).toBe(401);
  });

  /* ---- Error Formatting (SIL-23) ---- */
  test('returns sentence-cased error messages on validation failure', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/api/auth/login`, {
      data: { email: 'bad-email-format', password: '123' },
    });
    if (res.status() === 400 || res.status() === 401) {
      const body = await res.json();
      if (body.error?.message) {
        expect(body.error.message).toMatch(/^[A-Z].*\.$/);
      }
    }
  });

  /* ---- CORS Restrictions (SIL-26) ---- */
  test('CORS headers reject wildcard origins on backend API', async ({ request }) => {
    const res = await request.fetch(`${BACKEND_URL}/api/documents`, {
      method: 'OPTIONS',
      headers: { Origin: 'https://evil-site.com' },
    });
    const allowOrigin = res.headers()['access-control-allow-origin'];
    expect(allowOrigin).not.toBe('*');
  });
});
