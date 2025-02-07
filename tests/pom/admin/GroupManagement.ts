import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { confirmAction } from '../common/utils';

export class GroupDialog {
  readonly page: Page;
  readonly el: Locator;
  readonly alert: Locator;
  readonly name: Locator;
  readonly saveBtn: Locator;

  constructor(page: Page) {
    const el = page.locator('div[role="dialog"]');
    this.name = el.getByLabel('Group name');
    this.saveBtn = el.getByRole('button', { name: 'Save' });
    this.page = page;
    this.el = el;
  }

  async edit(name: string) {
    await this.enterName(name);
    await this.save();
  }

  enterName(value: string) {
    return this.name.fill(value);
  }

  async save() {
    await this.saveBtn.click();
    await expect(this.el).not.toBeVisible();
  }
}

export class GroupEntry {
  readonly page: Page;
  readonly el: Locator;
  readonly editBtn: Locator;
  readonly removeBtn: Locator;

  constructor(page: Page, el: Locator) {
    this.editBtn = el.getByRole('button', { name: 'Edit user group' });
    this.removeBtn = el.getByRole('button', { name: 'Delete user group' });
    this.el = el;
    this.page = page;
  }

  async edit(name: string) {
    await this.editBtn.click();
    const dialog = new GroupDialog(this.page);
    await dialog.edit(name);
    await expect(this.el).toContainText(name);
  }

  async delete() {
    await this.removeBtn.click();
    await confirmAction(this.page);
  }
}

export class GroupManagement {
  static route = 'admin/user-groups';
  readonly page: Page;
  readonly addBtn: Locator;
  readonly el: Locator;
  readonly groupTable: Locator;
  readonly groupEntriesLocator: Locator;
  readonly prevPage: Locator;
  readonly nextPage: Locator;
  readonly itemsPerPageBtn: Locator;

  constructor(page: Page) {
    const el = page.locator('.group-management');
    this.groupTable = el.locator('.v-table');
    this.addBtn = el.getByRole('button', { name: 'Add user group' });
    this.groupEntriesLocator = this.groupTable.locator('.group-entry');
    this.prevPage = el.getByRole('button', { name: 'Previous page' });
    this.nextPage = el.getByRole('button', { name: 'Next page' });
    const itemsPerPage = el.locator('.v-data-table-footer__items-per-page');
    this.itemsPerPageBtn = itemsPerPage.locator('.v-select');
    this.el = el;
    this.page = page;
  }

  async getEntries() {
    const items = await this.groupEntriesLocator.all();
    return items.map((it) => new GroupEntry(this.page, it));
  }

  getEntryLocator(name: string): Locator {
    return this.groupEntriesLocator.filter({ hasText: name }).first();
  }

  async getEntryByName(name: string) {
    const el = this.getEntryLocator(name);
    await expect(el).toBeVisible();
    return new GroupEntry(this.page, el);
  }

  async addUserGroup(name: string) {
    await this.addBtn.click();
    const dialog = new GroupDialog(this.page);
    await dialog.edit(name);
    return this.getEntryByName(name);
  }

  async removeUserGroup(name: string) {
    const entry = await this.getEntryByName(name);
    await entry.delete();
    await expect(entry.el).not.toBeVisible();
  }

  async selectItemsPerPage(value: number = 10 | 25 | 50 | 100) {
    await this.itemsPerPageBtn.click();
    await this.page
      .locator('.v-list-item .v-list-item-title')
      .filter({ hasText: value.toString() })
      .click();
  }
}
