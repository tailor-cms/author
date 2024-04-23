import { expect, Locator, Page } from '@playwright/test';
import { AddActivityDialog } from './AddActivityDialog';

export class ActivityOutline {
  readonly page: Page;
  readonly el: Locator;
  readonly bottomAddBtn: Locator;
  readonly toggleAllBtn: Locator;
  readonly searchInput: Locator;

  constructor(page: Page, el: Locator) {
    this.page = page;
    this.el = el;
    this.bottomAddBtn = el.getByTestId('repository__createRootActivityBtn');
    this.toggleAllBtn = el.getByRole('button', { name: 'Toggle all' });
    this.searchInput = el.getByLabel('Search by name or id...');
  }

  toggleExpand() {
    return this.toggleAllBtn.click();
  }

  async addRootActivity(type: string, name: string) {
    await this.bottomAddBtn.click();
    const dialog = this.page.locator('div[role="dialog"]');
    const addActivityDialog = new AddActivityDialog(dialog);
    await addActivityDialog.create(type, name);
  }

  getOutlineItems() {
    return this.el.locator('.activity-wrapper');
  }

  getOutlineItemByName(name: string) {
    return this.getOutlineItems().filter({ hasText: name });
  }
}
