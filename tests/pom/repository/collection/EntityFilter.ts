import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

// The entity chip filter shown above a collection list.
export class EntityFilter {
  readonly page: Page;
  readonly el: Locator;

  constructor(page: Page) {
    this.page = page;
    this.el = page.locator('.entity-filter');
  }

  chip(label: string) {
    return this.el.getByRole('button', { name: label });
  }

  async select(label: string) {
    await this.chip(label).click();
    await this.expectActive(label);
  }

  expectActive(label: string) {
    return expect(this.chip(label)).toHaveClass(/v-chip--selected/);
  }

  async getLabels() {
    return this.el.getByRole('button').allInnerTexts();
  }
}
