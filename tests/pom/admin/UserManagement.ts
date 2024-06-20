import { expect, Locator, Page } from '@playwright/test';

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
    firstName: string,
    lastName: string,
    email: string,
    role: 'Admin' | 'User',
  ) {
    await this.editFirstName(firstName);
    await this.editLastName(lastName);
    await this.editEmail(email);
    await this.selectRole(role);
    await this.save();
  }

  editFirstName(value: string) {
    return this.firstName.fill(value);
  }

  editLastName(value: string) {
    return this.lastName.fill(value);
  }

  editEmail(value: string) {
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

export class UserManagement {
  readonly page: Page;
  readonly el: Locator;
  readonly userTable: Locator;
  readonly addBtn: Locator;
  readonly archiveToggle: Locator;

  constructor(page: Page) {
    const el = page.locator('.user-management');
    this.userTable = el.locator('.v-table');
    this.addBtn = el.getByRole('button', { name: 'Add user' });
    this.archiveToggle = el.getByLabel('Archived');
    this.page = page;
    this.el = el;
  }

  getEntries() {
    return this.userTable.locator('.user-entry');
  }

  getEntryByEmail(email: string) {
    return this.getEntries().filter({ hasText: email });
  }

  async addUser(email: string, role: 'Admin' | 'User' = 'Admin') {
    await this.addBtn.click();
    const dialog = new UserDialog(this.page);
    await dialog.edit('John', 'Doe', email, role);
    await expect(this.getEntryByEmail(email)).toHaveCount(1);
  }

  async editUser(
    email: string,
    data: { firstName: string; lastName: string; role: 'Admin' | 'User' },
  ) {
    await this.addBtn.click();
    const dialog = new UserDialog(this.page);
    await dialog.edit(data.firstName, data.lastName, email, data.role);
    const entry = this.getEntryByEmail(email);
    await expect(entry).toContainText(data.firstName);
    await expect(entry).toContainText(data.lastName);
    await expect(entry).toContainText(data.role.toUpperCase());
  }

  async deactivateUser(email: string) {
    const entry = this.getEntryByEmail(email).locator('.user-entry-actions');
    await entry.getByRole('button', { name: 'Archive user' }).click();
    const dialog = this.page.locator('div[role="dialog"]');
    await dialog.getByRole('button', { name: 'confirm' }).click();
    await expect(entry).not.toBeVisible();
  }

  async restoreUser(email: string) {
    const entry = this.getEntryByEmail(email).locator('.user-entry-actions');
    await entry.getByRole('button', { name: 'Restore user' }).click();
    const dialog = this.page.locator('div[role="dialog"]');
    await dialog.getByRole('button', { name: 'confirm' }).click();
    await expect(dialog).not.toBeVisible();
  }
}
