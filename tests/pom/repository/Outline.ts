import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { AddItemDialog } from './AddItemDialog';
import { OutlineItem } from './OutlineItem';
import { OutlineSidebar } from './OutlineSidebar';

export class ActivityOutline {
  readonly page: Page;
  readonly el: Locator;
  readonly searchInput: Locator;
  readonly toggleAllBtn: Locator;
  readonly bottomAddBtn: Locator;

  constructor(page: Page) {
    const el = page.locator('.structure-page');
    this.searchInput = el.getByPlaceholder('Search by name or id...');
    this.toggleAllBtn = el.getByRole('button', { name: 'Toggle all' });
    this.bottomAddBtn = el.getByTestId('repository__createRootActivityBtn');
    this.page = page;
    this.el = el;
  }

  toggleExpand() {
    return this.toggleAllBtn.click();
  }

  search(name: string) {
    return this.searchInput.fill(name);
  }

  async getOutlineItems() {
    const items = await this.el.locator('.activity-wrapper').all();
    return items.map((item) => new OutlineItem(this.page, item));
  }

  async getOutlineItemByName(name: string) {
    const item = this.el.locator('.activity').filter({ hasText: name }).first();
    await expect(item).toBeVisible();
    return new OutlineItem(this.page, item);
  }

  async getOutlineItemByUid(uid: string) {
    const item = this.el.locator(`#activity_${uid}`);
    await expect(item).toBeVisible();
    return new OutlineItem(this.page, item);
  }

  async expandAndSelect(uid: string) {
    await this.toggleExpand();
    const item = await this.getOutlineItemByUid(uid);
    await item.select();
    const sidebar = new OutlineSidebar(this.page);
    return { item, sidebar };
  }

  async addRootItem(type: string, name: string) {
    await this.bottomAddBtn.click();
    const addActivityDialog = new AddItemDialog(this.page);
    await addActivityDialog.create(type, name);
    return this.getOutlineItemByName(name);
  }
}
