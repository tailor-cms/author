import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class Sidebar {
  readonly page: Page;
  readonly el: Locator;

  public static getUserAccessRoute = (id: number) =>
    `/repository/${id}/root/settings/access/user-management`;

  public static getGroupAccessRoute = (id: number) =>
    `/repository/${id}/root/settings/access/group-management`;

  constructor(page: Page, el: Locator) {
    this.page = page;
    this.el = el;
  }

  getSidebarAction(name: string) {
    return this.el.locator('.v-list-item-title').getByText(name);
  }

  async clone(name = 'Cloned repository') {
    await this.getSidebarAction('Clone').click();
    const dialog = this.page.locator('div[role="dialog"]');
    await dialog.getByLabel('Name').fill(name);
    await dialog.getByLabel('Description').fill('Test description');
    await dialog.getByRole('button', { name: 'Clone' }).click();
    await expect(dialog).not.toBeVisible();
  }

  async publish() {
    await this.getSidebarAction('Publish').click();
    const dialog = this.page.locator('div[role="dialog"]');
    await dialog.getByRole('button', { name: 'Confirm' }).click();
    await expect(dialog.getByText('Please wait...')).toBeVisible();
    await expect(dialog.getByText('Please wait...')).not.toBeVisible({
      timeout: 10000,
    });
  }

  async export() {
    await this.getSidebarAction('Export').click();
    const dialog = this.page.locator('div[role="dialog"]');
    await expect(dialog.getByText('Repository export is ready.')).toBeVisible({
      timeout: 10000,
    });
    const downloadEvent = this.page.waitForEvent('download');
    await dialog.getByRole('button', { name: 'Download' }).click();
    const download = await downloadEvent;
    await download.saveAs(`tmp/${download.suggestedFilename()}`);
  }

  async delete() {
    await this.getSidebarAction('Delete').click();
    const dialog = this.page.locator('div[role="dialog"]');
    await dialog.getByRole('button', { name: 'confirm' }).click();
  }
}

export class GeneralSettings {
  readonly page: Page;
  readonly el: Locator;
  readonly sidebar: Sidebar;
  readonly nameInput: Locator;
  readonly descriptionInput: Locator;

  constructor(page: Page) {
    const el = page.locator('.repository-settings');
    this.sidebar = new Sidebar(page, el.locator('.settings-sidebar'));
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
    await expect(this.page.locator('.v-snackbar')).toHaveText(/Saved/);
  }

  async updateDescription(description: string) {
    await this.descriptionInput.fill(description);
    await this.descriptionInput.blur();
    await expect(this.page.locator('.v-snackbar')).toHaveText(/Saved/);
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
    this.emailInput = el.getByPlaceholder('Enter email...');
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
  static getRoute = (id: number) =>
    `/repository/${id.toString()}/root/settings/access/user-management`;

  readonly page: Page;
  readonly el: Locator;
  readonly sidebar: Sidebar;
  readonly userTable: Locator;
  readonly userEntriesLocator: Locator;
  readonly addBtn: Locator;
  readonly prevPage: Locator;
  readonly nextPage: Locator;
  readonly itemsPerPageBtn: Locator;

  constructor(page: Page) {
    const el = page.locator('.repository-settings');
    this.sidebar = new Sidebar(page, el.locator('.settings-sidebar'));
    this.userTable = el.locator('.v-table');
    this.userEntriesLocator = this.userTable.locator('.user-entry');
    this.addBtn = el.getByRole('button', { name: 'Add user' });
    this.page = page;
    this.el = el;
    this.prevPage = el.getByRole('button', { name: 'Previous page' });
    this.nextPage = el.getByRole('button', { name: 'Next page' });
    const itemsPerPage = el.locator('.v-data-table-footer__items-per-page');
    this.itemsPerPageBtn = itemsPerPage.locator('.v-select');
  }

  getEntries() {
    return this.userEntriesLocator.all();
  }

  getEntryByEmail(email: string) {
    return this.userEntriesLocator.filter({ hasText: email });
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

  async selectItemsPerPage(value: number = 10 | 25 | 50 | 100) {
    await this.itemsPerPageBtn.click();
    await this.page
      .locator('.v-list-item .v-list-item-title')
      .filter({ hasText: value.toString() })
      .click();
  }
}
