import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

export class AddRepositoryDialog {
  readonly page: Page;
  readonly openDialogBtn: Locator;
  readonly dialog: Locator;
  readonly newTab: Locator;
  readonly importTab: Locator;
  readonly typeInput: Locator;
  readonly nameInput: Locator;
  readonly descriptionInput: Locator;
  readonly archiveInput: Locator;
  readonly createRepositoryBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    // Dialog activator
    this.openDialogBtn = page.getByLabel('Add repository');
    // Dialog internals
    const dialog = page.locator('div[role="dialog"]');
    this.dialog = dialog;
    this.newTab = dialog.getByLabel('New repository');
    this.importTab = dialog.getByLabel('Import repository');
    this.typeInput = dialog.getByTestId('type-input');
    this.nameInput = dialog.getByLabel('Name');
    this.descriptionInput = dialog.getByLabel('Description');
    this.archiveInput = dialog.locator('input[name="archive"]');
    this.createRepositoryBtn = dialog.getByRole('button', { name: 'Create' });
  }

  open() {
    return this.openDialogBtn.click();
  }

  async createRepository(
    type = 'Course',
    name = `${faker.lorem.words(2)} ${new Date().getTime()}`,
    description = faker.lorem.words(4),
  ) {
    await this.newTab.click();
    await this.selectRepositoryType(type);
    await this.nameInput.fill(name);
    await this.descriptionInput.fill(description);
    await this.createRepositoryBtn.click();
    await expect(this.page.getByText(name)).toBeVisible();
    return { type, name, description };
  }

  async importRepository(
    name = `${faker.lorem.words(2)} ${new Date().getTime()}`,
    description = faker.lorem.words(4),
  ) {
    await this.importTab.click();
    // https://github.com/vuetifyjs/vuetify/issues/21058
    await this.archiveInput.click({ force: true });
    await this.archiveInput.setInputFiles('./fixtures/pizza.tgz');
    await this.nameInput.fill(name);
    await this.descriptionInput.fill(description);
    await this.createRepositoryBtn.click();
    await this.page.waitForTimeout(5000);
    return { name, description };
  }

  async selectRepositoryType(type: string) {
    await this.typeInput.click();
    await this.dialog.getByText(type, { exact: true }).click();
  }
}
