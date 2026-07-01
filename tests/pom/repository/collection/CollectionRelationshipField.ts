import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

// Entity relationship input
export class CollectionRelationshipField {
  readonly page: Page;
  readonly el: Locator;
  readonly input: Locator;

  constructor(page: Page, card: Locator, label: string) {
    this.page = page;
    this.el = card
      .locator('.collection-relationship')
      .filter({ hasText: label });
    this.input = this.el.locator('.v-autocomplete input').first();
  }

  async select(name: string) {
    await this.input.click();
    // Filter the list, then wait for the option to appear.
    await this.input.fill(name);
    const option = this.page
      .locator('.v-overlay-container')
      .getByRole('option', { name });
    await option.waitFor({ state: 'visible' });
    await option.click();
    // Multi-select keeps the menu open; dismiss it before the next action.
    await this.input.press('Escape');
  }

  // Inline relationship creation
  async createNew(name: string) {
    await this.el.getByRole('button', { name: 'Create' }).click();
    const dialog = this.page.getByTestId('createRelatedRecordDialog');
    await dialog.waitFor({ state: 'visible' });
    await dialog.locator('input').first().fill(name);
    await dialog.getByRole('button', { name: 'Create' }).click();
    await expect(dialog).toBeHidden();
  }

  // Multi-select renders chips (text content); single-select shows the value on
  // the input - check both.
  async expectSelected(name: string) {
    await expect
      .poll(async () => {
        const text = (await this.el.textContent()) ?? '';
        const value = await this.input.inputValue().catch(() => '');
        return `${text} ${value}`;
      })
      .toContain(name);
  }

  expectError(message: string | RegExp) {
    return expect(this.el).toContainText(message);
  }
}
