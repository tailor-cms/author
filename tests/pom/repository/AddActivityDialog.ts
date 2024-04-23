import { Locator } from '@playwright/test';

export class AddActivityDialog {
  readonly el: Locator;
  readonly typeSelect: Locator;
  readonly nameInput: Locator;
  readonly createBtn: Locator;

  constructor(el: Locator) {
    this.el = el;
    this.typeSelect = el.getByTestId('type-select');
    this.nameInput = el.getByLabel(/Name/);
    this.createBtn = el.getByRole('button', { name: 'Create' });
  }

  async addActivity(type: string, name: string) {
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
