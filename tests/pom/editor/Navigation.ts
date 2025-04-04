import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class Navigation {
  readonly page: Page;
  readonly el: Locator;
  readonly searchInput: Locator;
  readonly toggleAllBtn: Locator;
  readonly treeView: Locator;

  constructor(page: Page, parent: Locator) {
    this.page = page;
    this.el = parent.locator('.navigation-container');
    this.searchInput = this.el.getByLabel('Search...');
    this.toggleAllBtn = this.el.getByRole('button', { name: 'Toggle all' });
    this.treeView = this.el.locator('.tree-view');
  }

  toggleItems() {
    return this.toggleAllBtn.click();
  }

  async getOutlineItems(name?: string) {
    const el = this.el.locator('.v-list-item');
    return name ? el.filter({ hasText: name }).all() : el.all();
  }

  async getOutlineItemByName(name: string) {
    const items = await this.getOutlineItems(name);
    return items[0];
  }

  async navigateTo(name: string) {
    await expect(this.el).toBeVisible();
    const item = await this.getOutlineItemByName(name);
    await item.click();
  }
}
