import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

export class AddRepositoryDialog {
  readonly page: Page;
  readonly openDialogBtn: Locator;
  readonly emptyCreateCard: Locator;
  readonly dialog: Locator;
  readonly newTab: Locator;
  readonly importTab: Locator;
  readonly typeInput: Locator;
  readonly nameInput: Locator;
  readonly descriptionInput: Locator;
  readonly archiveInput: Locator;
  readonly submitBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    // Dialog activators — non-empty catalog uses the toolbar button;
    // empty catalog uses the action card in the empty state.
    this.openDialogBtn = page.getByLabel('Add repository');
    this.emptyCreateCard = page.getByTestId('catalog__emptyCreate');
    // Dialog internals
    const dialog = page.locator('div[role="dialog"]');
    this.dialog = dialog;
    this.newTab = dialog.getByLabel('New repository');
    this.importTab = dialog.getByLabel('Import repository');
    this.typeInput = dialog.getByTestId('type-input');
    this.nameInput = dialog.getByLabel('Name');
    this.descriptionInput = dialog.getByLabel('Description');
    this.archiveInput = dialog.locator('input[name="archive"]');
    // Submit follows the active tab: "Create" on New, "Import" on Import
    this.submitBtn = dialog.getByRole('button', {
      name: /^(Create|Import)$/,
    });
  }

  async open() {
    const isNonEmpty = await this.openDialogBtn.isVisible();
    if (isNonEmpty) return this.openDialogBtn.click();
    return this.emptyCreateCard.click();
  }

  async submitCreate(
    type = 'Course',
    name = `${faker.lorem.words(2)} ${new Date().getTime()}`,
    description = faker.lorem.words(4),
  ) {
    await this.newTab.click();
    await this.selectRepositoryType(type);
    await this.nameInput.fill(name);
    await this.descriptionInput.fill(description);
    await this.submitBtn.click();
    return { type, name, description };
  }

  async submitImport(
    name = `${faker.lorem.words(2)} ${new Date().getTime()}`,
    description = faker.lorem.words(4),
    archive = './fixtures/pizza.tgz',
  ) {
    await this.importTab.click();
    // https://github.com/vuetifyjs/vuetify/issues/21058
    await this.archiveInput.click({ force: true });
    await this.archiveInput.setInputFiles(archive);
    await this.nameInput.fill(name);
    await this.descriptionInput.fill(description);
    await this.submitBtn.click();
    return { name, description };
  }

  async createRepository(
    type = 'Course',
    name = `${faker.lorem.words(2)} ${new Date().getTime()}`,
    description = faker.lorem.words(4),
  ) {
    const result = await this.submitCreate(type, name, description);
    await expect(this.page.getByText(name)).toBeVisible();
    return result;
  }

  async importRepository(
    name = `${faker.lorem.words(2)} ${new Date().getTime()}`,
    description = faker.lorem.words(4),
    archive = './fixtures/pizza.tgz',
  ) {
    const result = await this.submitImport(name, description, archive);
    await this.page.waitForTimeout(5000);
    return result;
  }

  async selectRepositoryType(type: string) {
    await this.typeInput.click();
    await this.dialog.getByText(type, { exact: true }).click();
  }
}
