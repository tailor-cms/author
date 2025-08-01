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
    this.page = page;
    this.el = el;
  }

  open() {
    return this.addBtn.click();
  }

  async add(name: string) {
    await this.open();
    await this.page.getByRole('button', { name, exact: true }).click();
  }

  async openCopyDialog() {
    await this.open();
    await this.copyBtn.click();
  }
}
