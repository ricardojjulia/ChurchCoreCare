import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [['line']],
  use: {
    baseURL: 'http://127.0.0.1:3002',
    headless: true,
    bypassCSP: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'pnpm start:api',
      url: 'http://127.0.0.1:3001/health',
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: 'pnpm start:web',
      url: 'http://127.0.0.1:3002/',
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
});
