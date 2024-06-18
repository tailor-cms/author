import { expect, Locator, Page } from '@playwright/test';

export class Sidebar {
  readonly page: Page;
  readonly el: Locator;

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

export class RepositoryUsers {
  readonly page: Page;
  readonly el: Locator;
  readonly sidebar: Sidebar;
  readonly userTable: Locator;
  readonly addBtn: Locator;

  constructor(page: Page) {
    const el = page.locator('.repository-settings');
    this.sidebar = new Sidebar(page, el.locator('.settings-sidebar'));
    this.addBtn = el.getByRole('button', { name: 'Add user' });
    this.page = page;
    this.el = el;
    this.userTable = el.locator('.v-table');
  }

  getEntries() {
    return this.userTable.locator('.user-entry');
  }

  getEntryByEmail(email: string) {
    return this.getEntries().filter({ hasText: email });
  }

  async addUser(email: string, role: 'Admin' | 'Author' = 'Admin') {
    await this.addBtn.click();
    const dialog = this.page.locator('div[role="dialog"]');
    await dialog.getByLabel('Email').fill(email);
    // Due to autocomplete, click if user is already available
    await dialog.getByLabel('Email').click();
    await dialog.locator('.role-select').click();
    // Mounted outside of the dialog in order to avoid overlay issues
    const dropdownMenu = this.page.locator('.v-overlay.v-menu');
    await dropdownMenu
      .locator('.v-list-item-title')
      .filter({ hasText: role })
      .click();
    await dialog.getByRole('button', { name: 'Add' }).click();
    await expect(dialog).not.toBeVisible();
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
