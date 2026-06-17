import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

// Entity relationship input
export class CollectionRelationshipField {
  readonly page: Page;
  readonly field: Locator;
  readonly input: Locator;

  constructor(page: Page, card: Locator, label: string) {
    this.page = page;
    this.field = card.locator('.v-autocomplete').filter({ hasText: label });
    this.input = this.field.locator('input').first();
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

  // Multi-select renders chips (text content); single-select shows the value on
  // the input - check both.
  async expectSelected(name: string) {
    await expect
      .poll(async () => {
        const text = (await this.field.textContent()) ?? '';
        const value = await this.input.inputValue().catch(() => '');
        return `${text} ${value}`;
      })
      .toContain(name);
  }

  expectError(message: string | RegExp) {
    return expect(this.field).toContainText(message);
  }
}
