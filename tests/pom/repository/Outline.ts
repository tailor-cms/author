import { expect, Locator, Page } from '@playwright/test';

import { AddItemDialog } from './AddItemDialog';
import { OutlineItem } from './OutlineItem';

export class ActivityOutline {
  readonly page: Page;
  readonly el: Locator;
  readonly searchInput: Locator;
  readonly toggleAllBtn: Locator;
  readonly bottomAddBtn: Locator;

  constructor(page: Page) {
    const el = page.locator('.structure-page');
    this.searchInput = el.getByLabel('Search by name or id...');
    this.toggleAllBtn = el.getByRole('button', { name: 'Toggle all' });
    this.bottomAddBtn = el.getByTestId('repository__createRootActivityBtn');
    this.page = page;
    this.el = el;
  }

  toggleExpand() {
    return this.toggleAllBtn.click();
  }

  async getOutlineItems() {
    const items = await this.el.locator('.activity-wrapper').all();
    return items.map((item) => new OutlineItem(this.page, item));
  }

  async getOutlineItemByName(name: string) {
    const item = this.el
      .locator('.activity-wrapper')
      .filter({ hasText: name })
      .first();
    await expect(item).toBeVisible();
    return new OutlineItem(this.page, item);
  }

  async addRootItem(type: string, name: string) {
    await this.bottomAddBtn.click();
    const addActivityDialog = new AddItemDialog(this.page);
    await addActivityDialog.create(type, name);
    return this.getOutlineItemByName(name);
  }
}
