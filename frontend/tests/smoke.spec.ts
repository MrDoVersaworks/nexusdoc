import { test, expect } from '@playwright/test';

test.describe('NexusDoc Smoke Tests', () => {
  test('should load the landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/NexusDoc/);
    await expect(page.locator('h1')).toContainText('NexusDoc');
  });

  test('should verify no horizontal overflow on mobile view', async ({ page, isMobile }) => {
    await page.goto('/');
    if (isMobile) {
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(overflow).toBe(false);
    }
  });
});
