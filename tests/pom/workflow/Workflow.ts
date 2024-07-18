import { expect, Locator, Page } from '@playwright/test';

export class Workflow {
  readonly page: Page;
  readonly el: Locator;
  readonly searchFilter: Locator;
  readonly statusFilter: Locator;
  readonly assigneeFilter: Locator;
  readonly recentBtn: Locator;
  readonly table: Locator;

  constructor(page: Page) {
    this.el = page.locator('.workflow-page');
    this.searchFilter = this.el.getByPlaceholder('Search by name or id...');
    this.statusFilter = this.el.getByTestId('status-filter');
    this.assigneeFilter = this.el.getByTestId('assignee-filter');
    this.recentBtn = this.el.getByRole('button', { name: 'Recently updated' });
    this.table = this.el.getByRole('table');
    this.page = page;
  }

  toggleRecentlyUpdated() {
    return this.recentBtn.click();
  }

  search(name: string) {
    return this.searchFilter.fill(name);
  }

  async filterStatus(status: string) {
    await this.statusFilter.click();
    const menuItem = this.page
      .locator('.v-list-item-title')
      .filter({ hasText: status });
    await menuItem.click();
    await expect(menuItem).not.toBeVisible();
  }

  async filterAssignee(assignee: string) {
    await this.assigneeFilter.getByLabel(assignee).click();
  }

  getRow(name?: string) {
    return this.table.locator('tbody').getByRole('row', { name });
  }

  openItemByName(name: string) {
    return this.getRow(name).click();
  }
}
