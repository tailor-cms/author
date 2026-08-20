import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { NavigationRail } from './NavigationRail';

// The bare access route redirects to the Members section.
export const getAccessRoute = (id: number) => `/repository/${id}/root/access`;
export const getMembersRoute = (id: number) => `${getAccessRoute(id)}/members`;
export const getGroupsRoute = (id: number) => `${getAccessRoute(id)}/groups`;

// Section tabs on the Access page (Members | Groups).
export class AccessTabs {
  readonly page: Page;
  readonly el: Locator;

  constructor(page: Page) {
    this.page = page;
    this.el = page.locator('.repository-access .access-tabs');
  }

  open(tab: 'Members' | 'Groups') {
    return this.el.getByRole('tab', { name: tab, exact: true }).click();
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

export class RepositoryMembers {
  static getRoute = getMembersRoute;

  readonly page: Page;
  readonly el: Locator;
  readonly rail: NavigationRail;
  readonly tabs: AccessTabs;
  readonly userList: Locator;
  readonly userEntriesLocator: Locator;
  readonly addBtn: Locator;
  readonly pagination: Locator;
  readonly prevPage: Locator;
  readonly nextPage: Locator;

  constructor(page: Page) {
    const el = page.locator('.repository-access');
    this.rail = new NavigationRail(page);
    this.tabs = new AccessTabs(page);
    this.userList = el.locator('.member-list');
    this.userEntriesLocator = el.locator('.member-row');
    this.addBtn = el.getByRole('button', { name: 'Add user' });
    this.pagination = el.locator('.v-pagination');
    this.prevPage = this.pagination.getByRole('button', { name: 'Previous page' });
    this.nextPage = this.pagination.getByRole('button', { name: 'Next page' });
    this.page = page;
    this.el = el;
  }

  open() {
    return this.tabs.open('Members');
  }

  getEntries() {
    return this.userEntriesLocator.all();
  }

  getEntryByEmail(email: string) {
    return this.userEntriesLocator.filter({ hasText: email });
  }

  getRoleButton(email: string) {
    return this.getEntryByEmail(email).locator('.member-role-btn');
  }

  async setUserRole(email: string, role: 'Admin' | 'Author') {
    await this.getRoleButton(email).click();
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

export class RepositoryGroups {
  static getRoute = getGroupsRoute;

  readonly page: Page;
  readonly el: Locator;
  readonly rail: NavigationRail;
  readonly tabs: AccessTabs;
  readonly groupList: Locator;
  readonly groupEntriesLocator: Locator;
  readonly emptyState: Locator;
  readonly pagination: Locator;
  readonly prevPage: Locator;
  readonly nextPage: Locator;

  constructor(page: Page) {
    const el = page.locator('.repository-access');
    this.rail = new NavigationRail(page);
    this.tabs = new AccessTabs(page);
    this.groupList = el.locator('.group-list');
    this.groupEntriesLocator = el.locator('.group-row');
    this.emptyState = el.getByText(
      'No user groups associated with this repository yet.',
    );
    this.pagination = el.locator('.v-pagination');
    this.prevPage = this.pagination.getByRole('button', { name: 'Previous page' });
    this.nextPage = this.pagination.getByRole('button', { name: 'Next page' });
    this.page = page;
    this.el = el;
  }

  open() {
    return this.tabs.open('Groups');
  }

  getEntries() {
    return this.groupEntriesLocator.all();
  }

  getEntryByName(name: string) {
    return this.groupEntriesLocator.filter({ hasText: name });
  }
}
