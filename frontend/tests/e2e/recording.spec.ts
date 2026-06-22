import { test, expect, chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * SOVEREIGN RECORDING ENGINE (NEXUSDOC - FULL LIFECYCLE)
 */

// Manual Backend .env Retrieval (Frictionless & Secure)
const getBackendKey = () => {
    try {
        const envPath = path.resolve(__dirname, '../../../backend/.env');
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            const match = content.match(/GEMINI_API_KEY=["']?([^"'\n]+)["']?/);
            return match ? match[1] : null;
        }
    } catch (e) { return null; }
    return null;
};

const SYSTEM_API_KEY = process.env.GEMINI_API_KEY || getBackendKey() || 'sk-SOVEREIGN-DEMO-KEY';

const autoScroll = async (page: any, name: string) => {
    console.log(`[SOVEREIGN] ${name}: Scrolling to demonstrate adaptive UI...`);
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
    await page.waitForTimeout(10000);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await page.waitForTimeout(2000);
};

test.describe.configure({ mode: 'serial' });

const viewports = [
  { name: 'Desktop', width: 1920, height: 1080 },
  { name: 'Tablet', width: 1024, height: 768 },
  { name: 'Mobile', width: 390, height: 844 }
];

for (const vp of viewports) {
  test(`Full Lifecycle Demo - ${vp.name}`, async ({ }) => {
    test.setTimeout(300000); // 5 minutes timeout for the deliberate pace
    const browser = await chromium.launch({ 
      headless: false, // Forces Chrome to open visibly
    });
    
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });

    const page = await context.newPage();
    const timestamp = Date.now();
    const email = `demo_${timestamp}_${vp.name.toLowerCase()}@nexus.test`;
    const password = 'password123';

    try {
      // 1. THE LANDING PAGE
      console.log(`[SOVEREIGN] ${vp.name}: Visiting Landing Page...`);
      await page.goto('http://localhost:3001');
      await expect(page.getByText(/Sovereign Intelligence/i)).toBeVisible();
      await autoScroll(page, vp.name);

      // 1b. CONTACT DEMO
      console.log(`[SOVEREIGN] ${vp.name}: Contact Demo...`);
      const contactBtn = page.locator('button:has-text("Contact"), a:has-text("Contact")').first();
      if (await contactBtn.isVisible()) {
          await contactBtn.click();
          await page.waitForTimeout(1000);
          await page.locator('input[type="text"]').first().fill(`Observer (${vp.name})`);
          await page.locator('input[type="email"]').first().fill(email);
          await page.locator('textarea').first().fill('Interested in Sovereign architecture. Please reach out.');
          const keyInput = page.locator('input[type="password"]');
          if (await keyInput.isVisible()) await keyInput.fill(SYSTEM_API_KEY);
          await page.waitForTimeout(1000);
          await page.locator('form').getByRole('button', { name: /Send/i }).click();
          await page.waitForTimeout(3000);
      }

      // 2. REGISTRATION
      console.log(`[SOVEREIGN] ${vp.name}: Registering New Identity...`);
      await page.goto('http://localhost:3001/register');
      await page.waitForTimeout(2000);
      await page.locator('#register-name').fill(`Client Observer (${vp.name})`);
      await page.locator('#register-email').fill(email);
      await page.locator('#register-password').fill(password);
      await page.locator('#register-confirm').fill(password);
      await page.waitForTimeout(1000);
      await page.getByRole('button', { name: /Create Account/i }).click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(4000);

      // 3. THEME & UI EXPLORATION
      console.log(`[SOVEREIGN] ${vp.name}: Testing UI Transitions...`);
      // Wait for auto-redirect to dashboard instead of hard reload
      await page.waitForURL('**/dashboard');
      await page.waitForTimeout(3000);
      
      const sideToggle = page.locator('#sidebar-toggle');
      if (await sideToggle.isVisible()) {
        await sideToggle.click();
        await page.waitForTimeout(1000);
      }
      
      const themeToggle = page.locator('#theme-toggle-btn');
      if (await themeToggle.isVisible()) {
        await themeToggle.click();
        await page.waitForTimeout(2000);
        await themeToggle.click();
        await page.waitForTimeout(2000);
      }
      
      if (await sideToggle.isVisible()) {
        await sideToggle.click();
        await page.waitForTimeout(1000);
      }

      // 4. AI CONFIGURATION
      console.log(`[SOVEREIGN] ${vp.name}: Configuring AI Intelligence...`);
      const menuBtn = page.locator('#sidebar-toggle');
      if (await menuBtn.isVisible()) { await menuBtn.click(); await page.waitForTimeout(1000); }
      await page.getByRole('link', { name: /Settings/i }).first().click();
      await page.waitForTimeout(3000);
      await page.locator('#settings-api-key').fill(SYSTEM_API_KEY);
      await page.locator('#settings-model').fill('gemini-2.5-flash');
      await page.locator('#settings-embedding-model').fill('gemini-embedding-001');
      await page.waitForTimeout(1000);
      await page.getByRole('button', { name: /Save Settings/i }).click();
      await page.waitForTimeout(4000);

      // 5. MANUAL GUIDE & SCROLL
      console.log(`[SOVEREIGN] ${vp.name}: Exploring System Guide...`);
      if (await menuBtn.isVisible()) { await menuBtn.click(); await page.waitForTimeout(1000); }
      await page.getByRole('link', { name: /Guide/i }).first().click();
      await page.waitForTimeout(3000);
      await autoScroll(page, vp.name);

      // 6. DOCUMENT INGESTION
      console.log(`[SOVEREIGN] ${vp.name}: Uploading Document for Analysis...`);
      if (await menuBtn.isVisible()) { await menuBtn.click(); await page.waitForTimeout(1000); }
      await page.getByRole('link', { name: /Documents/i }).first().click();
      await page.waitForTimeout(3000);
      await page.locator('#upload-btn').click({ force: true });
      await page.waitForTimeout(2000);
      await page.locator('#upload-title').fill('Sovereign Engineering Standard');
      const filePath = path.resolve(__dirname, 'sample.txt');
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, 'Sovereign AI Protocol: Deterministic execution is the baseline for senior engineering. The system must remain 100% original while automation adapts to its core logic.');
      }
      await page.setInputFiles('input[type="file"]', filePath);
      await page.waitForTimeout(1000);
      await page.locator('#upload-submit').click();
      
      console.log(`[SOVEREIGN] ${vp.name}: Waiting for AI Processing...`);
      await page.locator('text=Document uploaded successfully!').waitFor({ state: 'visible', timeout: 120000 });
      await page.waitForTimeout(5000);

      // 7. SEMANTIC SEARCH & RESULT INTERACTION
      console.log(`[SOVEREIGN] ${vp.name}: Testing Semantic Search...`);
      if (await menuBtn.isVisible()) { await menuBtn.click(); await page.waitForTimeout(1000); }
      await page.getByRole('link', { name: /Search/i }).first().click();
      await page.waitForTimeout(3000);
      await page.locator('#search-input').fill('Sovereign Engineering');
      await page.waitForTimeout(2000);
      await page.locator('#search-submit').click();
      await page.waitForTimeout(5000);
      
      // Click first result to inspect
      const searchResult = page.locator('button:has-text("Sovereign Engineering Standard"), a:has-text("Sovereign Engineering Standard")').first();
      if (await searchResult.isVisible()) {
          console.log(`[SOVEREIGN] ${vp.name}: Inspecting Search Result...`);
          await searchResult.click();
          await page.waitForTimeout(5000);
          await autoScroll(page, vp.name);
          
          console.log(`[SOVEREIGN] ${vp.name}: Interacting with AI Summarization...`);
          const copyBtn = page.getByRole('button', { name: /Copy/i });
          if (await copyBtn.isVisible()) {
              await copyBtn.click();
              await page.waitForTimeout(1000);
          }
          
          const downloadBtn = page.getByRole('button', { name: /Download/i }).first();
          if (await downloadBtn.isVisible()) {
              await downloadBtn.click();
              await page.waitForTimeout(1000);

              // Handle C17 Security Preflight Warning Modal if visible
              const confirmBtn = page.getByRole('button', { name: /Acknowledge & Download/i });
              if (await confirmBtn.isVisible()) {
                  console.log(`[SOVEREIGN] ${vp.name}: Acknowledging Security Preflight Warning...`);
                  await confirmBtn.click();
                  await page.waitForTimeout(1500);
              }
          }
          
          const rawTextBtn = page.getByRole('button', { name: /View AI Raw Extraction/i });
          if (await rawTextBtn.isVisible()) {
              await rawTextBtn.click();
              await page.waitForTimeout(2000);
              await autoScroll(page, vp.name);
          }
      }

      // 8. EXPLICIT LOGOUT
      console.log(`[SOVEREIGN] ${vp.name}: Testing Explicit Logout...`);

      if (await menuBtn.isVisible()) {
          await menuBtn.click();
          await page.waitForTimeout(1000);
      }
      const logoutBtn = page.locator('#logout-btn');
      if (await logoutBtn.isVisible()) {
          await logoutBtn.click();
      } else {
          await page.goto('http://localhost:3001/login'); 
      }
      await page.waitForTimeout(3000);

      // 9. LOGIN CYCLE & IDENTITY PURGE
      console.log(`[SOVEREIGN] ${vp.name}: Verifying Session Persistence...`);
      await page.goto('http://localhost:3001/login'); 
      await page.waitForTimeout(3000);
      await page.locator('#login-email').fill(email);
      await page.locator('#login-password').fill(password);
      await page.getByRole('button', { name: /Sign In/i }).click();
      await page.waitForTimeout(5000);

      console.log(`[SOVEREIGN] ${vp.name}: Performing Final Security Cleanup...`);
      await page.waitForURL('**/dashboard');
      
      console.log(`[SOVEREIGN] ${vp.name}: Checking Admin Inbox...`);
      await page.goto('http://localhost:3001/admin/inbox');
      await page.waitForTimeout(3000);
      await autoScroll(page, vp.name);
      const markReadBtn = page.locator('button[title="Mark as read"], button:has-text("Mark Read")').first();
      if (await markReadBtn.isVisible()) {
          await markReadBtn.click();
          await page.waitForTimeout(2000);
      }
      const purgeMsgBtn = page.locator('button[title="Purge Message"], button:has-text("Purge")').first();
      if (await purgeMsgBtn.isVisible()) {
          page.once('dialog', async dialog => dialog.accept());
          await purgeMsgBtn.click();
          await page.waitForTimeout(2000);
      }
      await page.goto('http://localhost:3001/dashboard');
      await page.waitForTimeout(2000);

      if (await menuBtn.isVisible()) { await menuBtn.click(); await page.waitForTimeout(1000); }
      await page.getByRole('link', { name: /Settings/i }).first().click();
      await page.waitForTimeout(3000);
      
      // Delete API Key
      const deleteKeyBtn = page.locator('#delete-key-btn');
      if (await deleteKeyBtn.isVisible()) {
        await deleteKeyBtn.click();
        await page.waitForTimeout(2000);
        await page.locator('#delete-key-confirm').click();
        await page.waitForTimeout(3000);
      }

      // Delete Account
      console.log(`[SOVEREIGN] ${vp.name}: Purging Identity...`);
      await page.locator('#delete-account-btn').click();
      await page.waitForTimeout(2000);
      await page.locator('#delete-password').fill(password);
      await page.waitForTimeout(1000);
      await page.locator('#delete-account-confirm').click();
      
      await page.waitForURL('**/login', { timeout: 10000 });
      console.log(`[SOVEREIGN] ${vp.name}: Demo Lifecycle Complete.`);
      await page.waitForTimeout(4000);

    } catch (error) {
      console.error(`[ERR_SOVEREIGN] ${vp.name}: Demo interrupted:`, error);
      throw error;
    } finally {
      await browser.close();
    }
  });
}
