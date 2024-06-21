import { expect, Locator, Page } from '@playwright/test';

import { confirmAction } from '../common/utils';

export class UserDialog {
  readonly page: Page;
  readonly el: Locator;
  readonly email: Locator;
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly role: Locator;
  readonly saveBtn: Locator;

  constructor(page: Page) {
    const el = page.locator('div[role="dialog"]');
    this.email = el.getByLabel('Email');
    this.firstName = el.getByLabel('First name');
    this.lastName = el.getByLabel('Last name');
    this.role = el.locator('.role-select');
    this.saveBtn = el.getByRole('button', { name: 'Save' });
    this.page = page;
    this.el = el;
  }

  async edit(
    email: string,
    firstName: string,
    lastName: string,
    role: 'Admin' | 'User',
  ) {
    const isEdit = await this.email.inputValue();
    if (!isEdit) await this.enterEmail(email);
    await this.enterFirstName(firstName);
    await this.enterLastName(lastName);
    await this.selectRole(role);
    await this.save();
  }

  enterFirstName(value: string) {
    return this.firstName.fill(value);
  }

  enterLastName(value: string) {
    return this.lastName.fill(value);
  }

  enterEmail(value: string) {
    return this.email.fill(value);
  }

  async selectRole(role: 'Admin' | 'User') {
    await this.role.click();
    const dropdownMenu = this.page.locator('.v-overlay.v-menu');
    await dropdownMenu
      .locator('.v-list-item .v-list-item-title')
      .filter({ hasText: role })
      .click();
    await expect(dropdownMenu).toBeHidden();
  }

  async save() {
    await this.saveBtn.click();
    await expect(this.el).not.toBeVisible();
  }
}

export class UserEntry {
  readonly page: Page;
  readonly el: Locator;
  readonly editBtn: Locator;
  readonly achiveBtn: Locator;
  readonly restoreBtn: Locator;

  constructor(page: Page, el: Locator) {
    this.editBtn = el.getByRole('button', { name: 'Edit user' });
    this.achiveBtn = el.getByRole('button', { name: 'Archive user' });
    this.restoreBtn = el.getByRole('button', { name: 'Restore user' });
    this.el = el;
    this.page = page;
  }

  async edit(
    email: string,
    data: {
      firstName: string;
      lastName: string;
      role: 'Admin' | 'User';
    },
  ) {
    await this.editBtn.click();
    const dialog = new UserDialog(this.page);
    await dialog.edit(email, data.firstName, data.lastName, data.role);
    await expect(this.el).toContainText(data.firstName);
    await expect(this.el).toContainText(data.lastName);
    await expect(this.el).toContainText(data.role.toUpperCase());
  }

  async archive() {
    await this.achiveBtn.click();
    await confirmAction(this.page);
  }

  async restore() {
    await this.restoreBtn.click();
    await confirmAction(this.page);
  }
}

export class UserManagement {
  readonly page: Page;
  readonly el: Locator;
  readonly userTable: Locator;
  readonly archiveToggle: Locator;
  readonly addBtn: Locator;

  constructor(page: Page) {
    const el = page.locator('.user-management');
    this.userTable = el.locator('.v-table');
    this.archiveToggle = el.getByLabel('Archived');
    this.addBtn = el.getByRole('button', { name: 'Add user' });
    this.page = page;
    this.el = el;
  }

  async getEntries() {
    const items = await this.userTable.locator('.user-entry').all();
    return items.map((it) => new UserEntry(this.page, it));
  }

  async getEntryByEmail(email: string) {
    const el = this.userTable
      .locator('.user-entry')
      .filter({ hasText: email })
      .first();
    await expect(el).toBeVisible();
    return new UserEntry(this.page, el);
  }

  async addUser(
    email: string,
    firstName: string = 'John',
    lastName: string = 'Doe',
    role: 'Admin' | 'User' = 'Admin',
  ) {
    await this.addBtn.click();
    const dialog = new UserDialog(this.page);
    await dialog.edit(email, firstName, lastName, role);
    return this.getEntryByEmail(email);
  }

  async archiveUser(email: string) {
    const entry = await this.getEntryByEmail(email);
    await entry.archive();
    await expect(entry.el).not.toBeVisible();
  }

  async restoreUser(email: string) {
    const entry = await this.getEntryByEmail(email);
    await entry.restore();
    await expect(entry.el).toBeVisible();
  }
}
