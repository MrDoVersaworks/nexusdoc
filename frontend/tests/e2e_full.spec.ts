import { test, expect } from '@playwright/test';

test.describe('NexusDoc Sovereign Intelligence Flow', () => {
  const timestamp = Date.now();
  const testUser = {
    name: 'Doc Specialist',
    email: `nexus_${timestamp}@nexusdoc.test`,
    password: 'Password123!',
  };

  test.setTimeout(60000); // Higher timeout for slower local dev environments

  test('should complete the document intelligence lifecycle', async ({ page }) => {
    // 1. Registration
    await page.goto('/register');
    await page.locator('#register-name').fill(testUser.name);
    await page.locator('#register-email').fill(testUser.email);
    await page.locator('#register-password').fill(testUser.password);
    await page.locator('#register-confirm').fill(testUser.password);
    await page.locator('#register-submit').click();

    // Verify Redirect to Dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByText(/Ready to begin your intelligence journey/i)).toBeVisible();

    // 2. Navigation & Architecture Verification
    await page.getByRole('link', { name: /System Guide/i }).click();
    await expect(page.getByText(/System Guide & Architecture/i)).toBeVisible();
    await expect(page.getByText(/Matryoshka-Style Truncation/i)).toBeVisible();

    // 3. Settings & Security Audit
    await page.getByRole('link', { name: /Settings/i }).click();
    await expect(page.getByText(/AI Security Vault/i)).toBeVisible();
    
    // 4. Data Sovereignty Purge
    await page.getByRole('button', { name: /Delete My Account/i }).click();
    await page.getByPlaceholder(/Your current password/i).fill(testUser.password);
    
    const finalPurgeBtn = page.getByRole('button', { name: /Permanently Delete/i });
    await finalPurgeBtn.click();

    // Verify Redirect to Login after purge
    await expect(page).toHaveURL(/\/login/);
  });
});
