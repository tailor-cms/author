import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class RepositoryCard {
  readonly page: Page;
  readonly el: Locator;
  readonly addTagBtn: Locator;
  readonly pinBtn: Locator;

  constructor(page: Page, el: Locator) {
    this.page = page;
    this.el = el;
    this.addTagBtn = el.getByLabel('Add tag');
    this.pinBtn = el.getByLabel('Pin repository');
  }

  togglePin() {
    return this.pinBtn.click();
  }

  async addTag(tag: string) {
    await this.addTagBtn.click();
    const dialog = this.page.locator('div[role="dialog"]');
    const nameInput = dialog.locator('input');
    await nameInput.fill(tag);
    await nameInput.press('Enter');
    await this.page.waitForTimeout(200);
  }

  async removeTag(tagName: string) {
    const tagSelector = '.v-chip';
    const tag = this.el.locator(tagSelector).filter({ hasText: tagName });
    await expect(tag).toBeVisible();
    await tag.getByLabel('Remove tag').click();
    const dialog = this.page.locator('div[role="dialog"]');
    await dialog.getByRole('button', { name: 'confirm' }).click();
  }
}
