import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { escapeRegExp } from 'lodash-es';

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

// An entry of the topmost overlay menu
export const getMenuItem = (page: Page, name: string) =>
  page
    .locator('.v-overlay.v-menu')
    .last()
    .locator('.v-list-item')
    .filter({ hasText: name });

// Vuetify disables a list item with a class, not aria-disabled, so
// toBeDisabled() cannot see it
export const DISABLED_LIST_ITEM = /v-list-item--disabled/;

// Read all entries of the topmost overlay menu, then dismiss it
export const getMenuOptions = async (page: Page): Promise<string[]> => {
  const menu = page.locator('.v-overlay.v-menu').last();
  await expect(menu).toBeVisible();
  const options = await menu.locator('.v-list-item-title').allTextContents();
  await page.keyboard.press('Escape');
  await expect(menu).not.toBeVisible();
  return options;
};

export const expectAlert = async (page: Page, message: string) => {
  const toast = new Toast(page);
  await toast.hasText(message);
  await toast.waitForDismiss();
};

// Drags a resize handle sideways; positive moves it right
export const dragBy = async (page: Page, handle: Locator, deltaX: number) => {
  // Waits until the handle stops moving (a drawer slides in) and takes the
  // pointer, so the drag starts on it
  await handle.hover();
  const box = (await handle.boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + deltaX, y, { steps: 10 });
  await page.mouse.up();
};

// A dialog by its exact title
export const getDialog = (page: Page, title: string) =>
  page.locator('div[role="dialog"]', {
    has: page.locator('.dialog-title', {
      hasText: new RegExp(`^${escapeRegExp(title)}$`),
    }),
  });

// The items holding exactly `text`, not just containing it
export const withExactText = (items: Locator, text: string) =>
  items.filter({ has: items.page().getByText(text, { exact: true }) });
