import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { NavigationRail } from './NavigationRail';
import { Toast } from '../common/Toast';

export const getAccessRoute = (id: number) =>
  `/repository/${id}/root/settings/access`;

export class GeneralSettings {
  readonly page: Page;
  readonly el: Locator;
  readonly rail: NavigationRail;
  readonly nameInput: Locator;
  readonly descriptionInput: Locator;
  readonly toast: Toast;

  constructor(page: Page) {
    const el = page.locator('.repository-settings');
    this.rail = new NavigationRail(page);
    this.toast = new Toast(page);
    this.page = page;
    this.el = el;
    this.nameInput = el.getByLabel('Name');
    this.descriptionInput = el.getByLabel('Description');
  }

  getName() {
    return this.page.getByLabel('Name').inputValue();
  }

  async updateName(name: string) {
    await this.nameInput.fill(name);
    await this.nameInput.blur();
    await this.toast.isSaved();
  }

  async updateDescription(description: string) {
    await this.descriptionInput.fill(description);
    await this.descriptionInput.blur();
    await this.toast.isSaved();
  }
}

export class AddUserDialog {
  readonly page: Page;
  readonly el: Locator;
  readonly emailInput: Locator;
  readonly roleSelect: Locator;
  readonly cancelBtn: Locator;
  readonly addBtn: Locator;
  readonly alert: Locator;

  constructor(page: Page) {
    const el = page.getByRole('dialog');
    this.emailInput = el.getByRole('combobox', { name: 'Email' });
    this.roleSelect = el.locator('.role-select');
    this.cancelBtn = el.getByRole('button', { name: 'Cancel' });
    this.addBtn = el.getByRole('button', { name: 'Add' });
    this.alert = el.getByRole('alert');
    this.page = page;
    this.el = el;
  }

  async setEmail(email: string) {
    await this.emailInput.fill(email);
    // Due to autocomplete, click if user is already available
    await this.emailInput.click();
  }

  async setRole(role: 'Admin' | 'Author') {
    await this.roleSelect.click();
    // Mounted outside of the dialog in order to avoid overlay issues
    const dropdownMenu = this.page.locator('.v-overlay.v-menu');
    await dropdownMenu
      .locator('.v-list-item__content')
      .filter({ hasText: role })
      .click();
    await expect(dropdownMenu).not.toBeVisible();
  }

  async addUser(email: string, role: 'Admin' | 'Author' = 'Admin') {
    await this.setEmail(email);
    await this.setRole(role);
    await this.addBtn.click();
  }

  hasVisibleAlert(message: string | RegExp) {
    return expect(this.alert.getByText(message)).toBeVisible();
  }
}

export class RepositoryUsers {
  static getRoute = getAccessRoute;

  readonly page: Page;
  readonly el: Locator;
  readonly rail: NavigationRail;
  readonly userList: Locator;
  readonly groupList: Locator;
  readonly userEntriesLocator: Locator;
  readonly groupEntriesLocator: Locator;
  readonly addBtn: Locator;
  readonly usersTabBtn: Locator;
  readonly groupsTabBtn: Locator;

  constructor(page: Page) {
    const el = page.locator('.repository-settings');
    this.rail = new NavigationRail(page);
    this.userList = el.locator('.user-list');
    this.groupList = el.locator('.group-list');
    this.userEntriesLocator = el.locator('.user-row');
    this.groupEntriesLocator = el.locator('.group-row');
    this.addBtn = el.getByRole('button', { name: 'Add user' });
    this.usersTabBtn = el.getByRole('button', { name: 'Users', exact: true });
    this.groupsTabBtn = el.getByRole('button', { name: 'Groups', exact: true });
    this.page = page;
    this.el = el;
  }

  showUsersTab() {
    return this.usersTabBtn.click();
  }

  showGroupsTab() {
    return this.groupsTabBtn.click();
  }

  getEntries() {
    return this.userEntriesLocator.all();
  }

  getEntryByEmail(email: string) {
    return this.userEntriesLocator.filter({ hasText: email });
  }

  async setUserRole(email: string, role: 'Admin' | 'Author') {
    const entry = this.getEntryByEmail(email);
    await entry.locator('.user-role-btn').click();
    const menu = this.page.locator('.v-overlay.v-menu').last();
    await menu.locator('.role-option').filter({ hasText: role }).click();
  }

  async addUser(email: string, role: 'Admin' | 'Author' = 'Admin') {
    await this.addBtn.click();
    const dialog = new AddUserDialog(this.page);
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
