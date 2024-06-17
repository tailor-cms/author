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
