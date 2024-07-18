import { expect, Locator, Page } from '@playwright/test';

export class Workflow {
  readonly page: Page;
  readonly el: Locator;
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly recentBtn: Locator;
  readonly table: Locator;

  constructor(page: Page) {
    this.el = page.locator('.workflow-page');
    this.searchInput = this.el.getByPlaceholder('Search by name or id...');
    this.statusFilter = this.el.getByPlaceholder('Filter by status');
    this.recentBtn = this.el.getByRole('button', { name: 'Recently updated' });
    this.table = this.el.getByRole('table');
    this.page = page;
  }

  toggleRecentlyUpdated() {
    return this.recentBtn.click();
  }

  search(name: string) {
    return this.searchInput.fill(name);
  }

  async getItemByName(name: string) {
    const item = this.table.getByRole('row', { name });
    await expect(item).toBeVisible();
    return item;
  }

  async openItemByName(name: string) {
    const item = await this.getItemByName(name);
    return item.click();
  }
}
