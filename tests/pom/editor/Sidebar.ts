import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class EditorSidebar {
  readonly page: Page;
  readonly el: Locator;
  readonly searchInput: Locator;
  readonly toggleAllBtn: Locator;
  readonly treeView: Locator;

  constructor(page: Page) {
    const el = page.locator('.sidebar-container');
    this.searchInput = el.getByLabel('Search...');
    this.toggleAllBtn = el.getByRole('button', { name: 'Toggle all' });
    this.treeView = el.locator('.tree-view');
    this.page = page;
    this.el = el;
  }

  toggleItems() {
    return this.toggleAllBtn.click();
  }

  getRelationship(hasText: string) {
    return this.el.locator('.element-relationship', { hasText });
  }

  async addRelationship(relationship: string) {
    const rel = this.getRelationship(relationship);
    const addBtn = rel.getByRole('button', { name: 'Add Relationship' });
    await addBtn.click();
  }

  async clearRelationship(relationship: string) {
    const rel = this.getRelationship(relationship);
    const removeBtn = rel.getByRole('button', { name: 'Remove Relationships' });
    await removeBtn.click();
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
