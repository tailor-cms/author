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

// Pick an entry from the topmost overlay menu
export const selectMenuOption = async (page: Page, name: string) => {
  const menu = page.locator('.v-overlay.v-menu').last();
  await expect(menu).toBeVisible();
  await menu.locator('.v-list-item-title').filter({ hasText: name }).click();
};

export const expectAlert = async (page: Page, message: string) => {
  const toast = new Toast(page);
  await toast.hasText(message);
  await toast.waitForDismiss();
};
