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
});
