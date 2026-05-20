import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('NexusDoc — Sovereign AI Intelligence Matrix', () => {
  const timestamp = Date.now();
  const testUser = {
    name: 'Research Architect',
    email: `architect_${timestamp}@nexusdoc.test`,
    password: 'Password123!',
    docTitle: 'Neural Network Topology.pdf'
  };

  test('should execute the complete document intelligence lifecycle', async ({ page }) => {
    // 1. Identity Inception (Auth)
    await page.goto('/register');
    await page.getByLabel(/Full Name/i).fill(testUser.name);
    await page.getByLabel(/Email Address/i).fill(testUser.email);
    await page.getByLabel(/Password/i).fill(testUser.password);
    
    const registerPromise = page.waitForResponse(resp => resp.url().includes('/auth/register'));
    await page.getByRole('button', { name: /Create Account/i }).click();
    await registerPromise;

    // 2. Dashboard Hub & Empty State
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/Your Intelligence Vault is Empty/i)).toBeVisible();

    // 3. Document Inception (Upload)
    // Create a dummy PDF for testing
    const testFilePath = path.join(__dirname, 'test-doc.pdf');
    fs.writeFileSync(testFilePath, 'Sovereign Intelligence: Neural Network Topology Analysis');

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: /Upload/i }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(testFilePath);

    // Wait for AI Processing (Gemini 1.5 Flash)
    await expect(page.getByText(/Analyzing Document.../i)).toBeVisible();
    await expect(page.getByText(testUser.docTitle)).toBeVisible({ timeout: 30000 });

    // 4. Intelligence Retrieval (Search)
    const searchInput = page.getByPlaceholder(/Search your knowledge base.../i);
    await searchInput.fill('Neural Network');
    await page.keyboard.press('Enter');
    await expect(page.getByText(testUser.docTitle)).toBeVisible();

    // 5. Document Interaction (Summary View)
    await page.getByText(testUser.docTitle).click();
    await expect(page.getByText(/AI Summary/i)).toBeVisible();
    await expect(page.getByText(/Technical Insights/i)).toBeVisible();

    // 6. Data Sovereignty (Deletion & Purge)
    // Delete single document
    await page.getByRole('button', { name: /Purge Document/i }).click();
    await page.getByRole('button', { name: /Confirm Purge/i }).click();
    await expect(page.getByText(/Your Intelligence Vault is Empty/i)).toBeVisible();

    // 7. Global Account Purge
    await page.goto('/settings');
    await page.getByRole('button', { name: /Initiate Sovereign Purge/i }).click();
    await page.getByPlaceholder(/Enter your password to confirm/i).fill(testUser.password);
    await page.getByRole('button', { name: /Confirm Purge/i }).click();

    // Verification of total erasure
    await expect(page).toHaveURL(/\/login/);

    // Cleanup
    if (fs.existsSync(testFilePath)) fs.unlinkSync(testFilePath);
  });
});
