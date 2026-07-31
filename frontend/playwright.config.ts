import { defineConfig, devices } from '@playwright/test';

let PLAYWRIGHT_BASE_URL = 'http://localhost:3001';
if (process.env.PLAYWRIGHT_BASE_URL !== undefined && process.env.PLAYWRIGHT_BASE_URL.trim() !== '') {
  PLAYWRIGHT_BASE_URL = process.env.PLAYWRIGHT_BASE_URL.trim();
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: PLAYWRIGHT_BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run local backend & frontend dev servers before starting tests */
  webServer: [
    {
      command: 'npm --prefix ../backend run dev',
      url: 'http://localhost:4000/health',
      reuseExistingServer: true,
      timeout: 300 * 1000,
    },
    {
      command: 'npm run dev',
      url: PLAYWRIGHT_BASE_URL,
      reuseExistingServer: true,
      timeout: 120 * 1000,
    },
  ],
});
