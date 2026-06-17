import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

// The collection "Create" dialog. The type is pre-selected and locked to the
// active entity, so the only field to fill is the item title - whose label
// varies by entity (e.g. "Title", "Full name", "Name").
export class CreateItemDialog {
  readonly page: Page;
  readonly el: Locator;
  readonly typeSelect: Locator;
  readonly createBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.el = page.getByTestId('repository__createActivityDialog');
    this.typeSelect = this.el.getByTestId('type-select');
    this.createBtn = this.el.getByRole('button', { name: 'Create' });
  }

  expectTypeLocked() {
    return expect(this.typeSelect).toHaveClass(/v-input--disabled/);
  }

  async create(title: string, titleLabel: string) {
    await expect(this.el).toBeVisible();
    await this.el.getByLabel(titleLabel).fill(title);
    await this.createBtn.click();
  }
}
