import * as dotenv from 'dotenv';
import { defineConfig, devices } from '@playwright/test';

dotenv.config();

if (!process.env.APP_URL) process.env.APP_URL = 'http://localhost:3000';

// See https://playwright.dev/docs/test-configuration.
export default defineConfig({
  testDir: './specs',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Opt out of parallel tests on CI.
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: process.env.APP_URL,
    trace: 'on-first-retry',
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'chrome',
      testDir: './specs/functional',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth.json',
      },
    },
    {
      name: 'visual',
      testDir: './specs/visual',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth.json',
      },
    },
    {
      name: 'a11y',
      testDir: './specs/a11y',
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
