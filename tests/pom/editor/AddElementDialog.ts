import type { Locator, Page } from '@playwright/test';

export class AddElementDialog {
  readonly page: Page;
  readonly el: Locator;
  readonly addBtn: Locator;
  readonly copyBtn: Locator;

  constructor(page: Page) {
    const el = page.locator('div[role="dialog"].v-bottom-sheet');
    this.addBtn = page.getByRole('button', { name: 'Add content' });
    this.copyBtn = el.getByRole('button', { name: 'Copy existing' });
    this.el = el;
  }

  async open() {
    await this.addBtn.click();
  }

  async add(name: string) {
    await this.open();
    await this.page.getByRole('button', { name }).click();
  }

  async openCopyDialog() {
    await this.open();
    await this.copyBtn.click();
  }
}
