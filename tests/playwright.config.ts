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
      name: 'chrome-admin',
      testDir: './specs/functional',
      testIgnore: ['*.default-user.spec.ts', '*.collaborator.spec.ts', '*.setup.spec.ts'],
      dependencies: ['setup-admin'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth-admin.json',
      },
    },
    {
      name: 'chrome-default-user',
      testDir: './specs/functional',
      testMatch: ['*.default-user.spec.ts'],
      dependencies: ['setup-default-user'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth-default-user.json',
      },
    },
    {
      name: 'chrome-collaborator',
      testDir: './specs/functional',
      testMatch: ['*.collaborator.spec.ts'],
      dependencies: ['setup-collaborator'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth-collaborator.json',
      },
    },
    {
      name: 'visual',
      testDir: './specs/visual',
      dependencies: ['setup-admin'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth-admin.json',
      },
    },
    {
      name: 'a11y',
      testDir: './specs/a11y',
      dependencies: ['setup-admin'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth-admin.json',
      },
    },
    {
      name: 'setup-admin',
      testMatch: 'admin.setup.spec.ts',
    },
    {
      name: 'setup-default-user',
      testMatch: 'default-user.setup.spec.ts',
    },
    {
      name: 'setup-collaborator',
      testMatch: 'collaborator.setup.spec.ts',
    },
  ],
});
