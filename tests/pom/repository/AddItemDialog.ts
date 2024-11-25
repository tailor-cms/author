import type { Locator, Page } from '@playwright/test';

export class AddItemDialog {
  readonly page: Page;
  readonly el: Locator;
  readonly typeSelect: Locator;
  readonly nameInput: Locator;
  readonly createBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.el = this.page.locator('div[role="dialog"]');
    this.typeSelect = this.el.getByTestId('type-select');
    this.nameInput = this.el.getByLabel(/Name/);
    this.createBtn = this.el.getByRole('button', { name: 'Create' });
  }

  async create(type: string, name: string) {
    await this.selectActivityType(type);
    await this.nameInput.fill(name);
    await this.createBtn.click();
  }

  async selectActivityType(type: string) {
    await this.typeSelect.click();
    await this.el
      .locator('.v-list-item-title')
      .filter({ hasText: type })
      .click();
  }
}
