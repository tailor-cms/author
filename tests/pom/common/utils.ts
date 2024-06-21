import { expect, Page } from '@playwright/test';

export const confirmAction = async (
  page: Page,
  confirmationBtnLabel = 'confirm',
) => {
  const dialog = page.locator('div[role="dialog"]');
  await dialog.getByRole('button', { name: confirmationBtnLabel }).click();
  await expect(dialog).not.toBeVisible();
};
