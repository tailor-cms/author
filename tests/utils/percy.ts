import type { Page } from '@playwright/test';
import percy from '@percy/playwright/index.js';

export async function percySnapshot(page: Page, name: string) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await percy(page, name);
}
