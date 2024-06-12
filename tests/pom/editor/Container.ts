import { expect, Locator, Page } from '@playwright/test';

export class Container {
  readonly page: Page;
  readonly el: Locator;
  readonly deleteBtn: Locator;

  constructor(page: Page, el: Locator) {
    this.page = page;
    this.el = el;
    this.deleteBtn = el.getByRole('button', { name: 'Delete section' });
  }

  async remove() {
    await this.deleteBtn.click();
    const dialog = this.page.locator('div[role="dialog"]');
    await dialog.getByRole('button', { name: 'confirm' }).click();
    await expect(this.el).not.toBeVisible();
  }
}
