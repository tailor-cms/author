import { expect, Locator, Page } from '@playwright/test';
import { faker } from '@faker-js/faker';

export class AddRepositoryDialog {
  readonly page: Page;
  readonly openDialogBtn: Locator;
  readonly dialogArea: Locator;
  readonly newTab: Locator;
  readonly importTab: Locator;
  readonly typeInput: Locator;
  readonly nameInput: Locator;
  readonly descriptionInput: Locator;
  readonly createRepositoryBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.openDialogBtn = page.getByLabel('Add repository');
    this.dialogArea = page.locator('div[role="dialog"]');
    this.newTab = this.dialogArea.getByLabel('New repository');
    this.importTab = this.dialogArea.getByLabel('Import repository');
    this.typeInput = this.dialogArea.getByTestId('type-input');
    this.nameInput = this.dialogArea.getByLabel('Name');
    this.descriptionInput = this.dialogArea.getByLabel('Description');
    this.createRepositoryBtn = this.dialogArea.getByRole('button', {
      name: 'Create',
    });
  }

  open() {
    return this.openDialogBtn.click();
  }

  async create(
    type = 'Course',
    name = `${faker.lorem.words(2)}  ${new Date().getTime()}`,
    description = faker.lorem.words(4),
  ) {
    await this.selectRepositoryType(type);
    await this.newTab.click();
    await this.nameInput.fill(name);
    await this.descriptionInput.fill(description);
    await this.createRepositoryBtn.click();
    await expect(this.page.getByText(name)).toBeVisible();
    return { type, name, description };
  }

  async selectRepositoryType(type: string) {
    await this.typeInput.click();
    await this.dialogArea.getByText(type).click();
  }
}
