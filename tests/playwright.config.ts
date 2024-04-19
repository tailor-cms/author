import * as dotenv from 'dotenv';
import { defineConfig, devices } from '@playwright/test';

dotenv.config();

// See https://playwright.dev/docs/test-configuration.
export default defineConfig({
  testDir: './specs',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Opt out of parallel tests on CI.
  workers: 1,
  reporter: 'html',
  use: {
    // Base URL to use in actions like `await page.goto('/')`.
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chrome',
      testDir: './specs/ui',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth.json',
      },
    },
    {
      name: 'setup',
      testMatch: 'setup.spec.ts',
    },
  ],
});
