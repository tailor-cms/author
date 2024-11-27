import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export const confirmAction = async (
  page: Page,
  confirmationBtnLabel = 'confirm',
) => {
  const dialog = page.locator('div[role="dialog"]');
  await dialog.getByRole('button', { name: confirmationBtnLabel }).click();
  await expect(dialog).not.toBeVisible();
};

export const expectAlert = async (page: Page, message: string) => {
  const alertLocator = page.locator('.v-snackbar');
  await expect(alertLocator).toHaveText(message);
  await expect(alertLocator).not.toBeVisible();
};
