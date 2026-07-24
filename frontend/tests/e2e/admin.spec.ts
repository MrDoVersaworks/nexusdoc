import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('NexusDoc System Administration & Guide', () => {
  test('admin settings and guide inspection', async ({ page }) => {
    test.setTimeout(60000);
    const screenshotDir = path.resolve(__dirname, '../../public/screenshots');
    if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

    // 1. Settings Page View
    await page.goto('http://localhost:3001/dashboard/settings', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, 'settings.png') });

    // 2. Guide & Documentation View
    await page.goto('http://localhost:3001/dashboard/guide', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, 'guide.png') });

    // 3. Admin Inbox View
    await page.goto('http://localhost:3001/admin/inbox', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, 'admin_inbox.png') });
  });
});
