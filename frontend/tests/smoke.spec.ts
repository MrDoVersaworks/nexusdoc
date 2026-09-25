import { test, expect } from '@playwright/test';

test.describe('NexusDoc public smoke', () => {
  for (const path of ['/', '/login', '/register', '/terms', '/privacy']) {
    test(`renders ${path}`, async ({ page }) => {
      await page.route('**/api/public/**', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) });
      });
      const consoleErrors: string[] = [];
      page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('body')).toBeVisible();
      expect(consoleErrors).toEqual([]);
    });
  }

  test('password visibility controls work on login and registration', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    const loginPassword = page.locator('#login-password');
    const loginToggle = page.getByRole('button', { name: 'Show password' });
    await expect(loginPassword).toHaveAttribute('type', 'password');
    await loginToggle.click();
    await expect(loginPassword).toHaveAttribute('type', 'text');
    await expect(page.getByRole('button', { name: 'Hide password' })).toBeVisible();

    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    const registerPassword = page.locator('#register-password');
    const confirmPassword = page.locator('#register-confirm');
    await page.getByRole('button', { name: 'Show password' }).first().click();
    await expect(registerPassword).toHaveAttribute('type', 'text');
    await page.getByRole('button', { name: 'Show confirmation password' }).click();
    await expect(confirmPassword).toHaveAttribute('type', 'text');
  });
});
