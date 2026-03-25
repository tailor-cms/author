import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { Toast } from './Toast';

export const confirmAction = async (
  page: Page,
  confirmationBtnLabel = 'confirm',
) => {
  const dialog = page.locator('div[role="dialog"]');
  await dialog.getByRole('button', { name: confirmationBtnLabel }).click();
  await expect(dialog).not.toBeVisible();
};

export const expectAlert = async (page: Page, message: string) => {
  const toast = new Toast(page);
  await toast.hasText(message);
  await toast.waitForDismiss();
};
