import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { confirmAction } from '../common/utils';

export class UserGroupUserAssignment {
  readonly page: Page;
  readonly el: Locator;
  readonly emailInput: Locator;
  readonly roleSelect: Locator;
  readonly cancelBtn: Locator;
  readonly addBtn: Locator;

  constructor(page: Page) {
    const el = page.getByRole('dialog');
    this.emailInput = el.getByPlaceholder('Enter email...');
    this.roleSelect = el.locator('.group-role-select');
    this.cancelBtn = el.getByRole('button', { name: 'Cancel' });
    this.addBtn = el.getByRole('button', { name: 'Add' });
    this.page = page;
    this.el = el;
  }

  async setEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async setRole(role: 'Admin' | 'User' | 'Collaborator') {
    await this.roleSelect.click();
    // Mounted outside of the dialog in order to avoid overlay issues
    const dropdownMenu = this.page.locator('.v-overlay.v-menu');
    await dropdownMenu
      .locator('.v-list-item__content')
      .filter({ hasText: role })
      .click();
    await expect(dropdownMenu).not.toBeVisible();
  }

  async addUser(
    email: string,
    role: 'Admin' | 'User' | 'Collaborator' = 'Admin',
  ) {
    await this.setEmail(email);
    await this.setRole(role);
    await this.addBtn.click();
  }
}

export class UserGroupUserList {
  static getRoute = (id: number) => `/admin/user-groups/${id.toString()}`;

  readonly page: Page;
  readonly el: Locator;
  readonly userList: Locator;
  readonly userEntriesLocator: Locator;
  readonly addBtn: Locator;
  readonly searchInput: Locator;
  readonly sortToggle: Locator;
  readonly prevPage: Locator;
  readonly nextPage: Locator;

  constructor(page: Page) {
    const el = page.locator('.user-group-users');
    this.userList = el.locator('.member-list');
    this.userEntriesLocator = this.userList.locator('.member-row');
    this.addBtn = el.getByRole('button', { name: 'Add user' });
    this.searchInput = el.getByPlaceholder('Search members...');
    this.sortToggle = el.getByRole('button', { name: 'Toggle sort order' });
    this.prevPage = el.getByRole('button', { name: 'Previous page' });
    this.nextPage = el.getByRole('button', { name: 'Next page' });
    this.page = page;
    this.el = el;
  }

  getEntries() {
    return this.userEntriesLocator.all();
  }

  getEntryByEmail(email: string) {
    return this.userEntriesLocator.filter({ hasText: email });
  }

  async addUser(
    email: string,
    role: 'Admin' | 'User' | 'Collaborator' = 'Admin',
  ) {
    await this.addBtn.click();
    const dialog = new UserGroupUserAssignment(this.page);
    await dialog.addUser(email, role);
    await expect(dialog.el).not.toBeVisible();
    await expect(this.getEntryByEmail(email)).toHaveCount(1);
  }

  async removeUser(email: string) {
    const entry = this.getEntryByEmail(email);
    await entry.getByRole('button', { name: 'Remove user' }).click();
    const dialog = this.page.locator('div[role="dialog"]');
    await dialog.getByRole('button', { name: 'confirm' }).click();
    await expect(entry).not.toBeVisible();
  }
}

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
  readonly actionsBtn: Locator;

  constructor(page: Page, el: Locator) {
    this.actionsBtn = el.getByRole('button', { name: 'User group actions' });
    this.el = el;
    this.page = page;
  }

  // Edit/delete live in the card's overflow menu
  private async selectAction(label: 'Edit' | 'Delete') {
    await this.actionsBtn.click();
    const menu = this.page.locator('.v-overlay.v-menu');
    await menu
      .locator('.v-list-item')
      .filter({ hasText: label })
      .click();
    await expect(menu).toBeHidden();
  }

  async edit(name: string) {
    await this.selectAction('Edit');
    const dialog = new GroupDialog(this.page);
    await dialog.edit(name);
    await expect(this.el).toContainText(name);
  }

  async delete() {
    await this.selectAction('Delete');
    await confirmAction(this.page);
  }
}

export class GroupManagement {
  static route = 'admin/user-groups';
  readonly page: Page;
  readonly el: Locator;
  readonly addBtn: Locator;
  readonly groupGrid: Locator;
  readonly groupEntriesLocator: Locator;
  readonly prevPage: Locator;
  readonly nextPage: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    const el = page.locator('.group-management');
    this.groupGrid = el.locator('.group-grid');
    this.addBtn = el.getByRole('button', { name: 'Add user group' });
    this.searchInput = el.getByTestId('search-user-groups').locator('input');
    this.groupEntriesLocator = this.groupGrid.getByTestId('user-group-card');
    this.prevPage = el.getByRole('button', { name: 'Previous page' });
    this.nextPage = el.getByRole('button', { name: 'Next page' });
    this.el = el;
    this.page = page;
  }

  static async visit(page: Page) {
    await page.goto(GroupManagement.route, { waitUntil: 'networkidle' });
    return new GroupManagement(page);
  }

  static async create(
    page: Page,
    name: string,
    options: { visit: boolean } = { visit: false },
  ) {
    const groupManagement = await GroupManagement.visit(page);
    await groupManagement.addUserGroup(name);
    const entry = await groupManagement.getEntryByName(name);
    if (options.visit) {
      // The whole card navigates to the group detail page
      await entry.el.click();
      await expect(page.getByRole('heading', { name })).toBeVisible();
    }
  }

  static async goToGroupByName(page: Page, name: string) {
    const groupManagement = await GroupManagement.visit(page);
    const entry = await groupManagement.getEntryByName(name);
    await entry.el.click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name })).toBeVisible();
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
}
