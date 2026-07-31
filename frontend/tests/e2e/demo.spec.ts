import { test, expect } from '@playwright/test';

const BACKEND_URL = 'http://localhost:4000';
const FRONTEND_URL = 'http://localhost:3001';

test.describe('NexusDoc — Public & User Features', () => {
  /* ---- UI Page Renders ---- */
  test('landing page renders successfully', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await expect(page.locator('body')).toBeVisible();
  });

  test('login page renders with required form inputs', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/login`);
    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
    await expect(page.locator('#login-submit')).toBeVisible();
  });

  test('register page renders with required form inputs', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/register`);
    await expect(page.locator('#register-name')).toBeVisible();
    await expect(page.locator('#register-email')).toBeVisible();
    await expect(page.locator('#register-password')).toBeVisible();
    await expect(page.locator('#register-confirm')).toBeVisible();
    await expect(page.locator('#register-submit')).toBeVisible();
  });

  test('privacy policy page renders', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/privacy`);
    await expect(page.locator('body')).toBeVisible();
  });

  test('terms of service page renders', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/terms`);
    await expect(page.locator('body')).toBeVisible();
  });

  /* ---- Public Backend API Checks ---- */
  test('GET /health returns 200 OK', async ({ request }) => {
    const res = await request.get(`${BACKEND_URL}/health`);
    expect(res.status()).toBe(200);
  });

  test('GET /public/settings returns settings', async ({ request }) => {
    const res = await request.get(`${BACKEND_URL}/api/public/settings`);
    expect(res.status()).toBe(200);
  });

  test('GET /public/reviews returns approved reviews', async ({ request }) => {
    const res = await request.get(`${BACKEND_URL}/api/public/reviews`);
    expect(res.status()).toBe(200);
  });

  test('POST /public/reviews submits user review', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/api/public/reviews`, {
      data: {
        name: 'Lead Architect',
        rating: 5,
        feedback: 'NexusDoc vector embeddings and natural language search are seamless.',
      },
    });
    expect([200, 201, 400]).toContain(res.status());
  });

  test('POST /contact submits contact message', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/api/contact`, {
      data: {
        name: 'Knowledge Admin',
        email: 'admin@docnexus.org',
        message: 'Inquiring about document OCR chunking algorithms.',
      },
    });
    expect([200, 201, 400]).toContain(res.status());
  });

  /* ---- Auth API Checks ---- */
  test('POST /auth/register rejects empty body', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/api/auth/register`, { data: {} });
    expect([400, 422]).toContain(res.status());
  });

  test('POST /auth/login rejects invalid credentials', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/api/auth/login`, {
      data: { email: 'fake@nexusdoc.ai', password: 'wrong' },
    });
    expect([400, 401]).toContain(res.status());
  });
});
