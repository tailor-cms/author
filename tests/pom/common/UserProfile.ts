import { Locator, Page } from '@playwright/test';

export class UserProfile {
  readonly page: Page;
  readonly email: Locator;
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly saveBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.email = page.getByLabel('Email');
    this.firstName = page.getByLabel('First name');
    this.lastName = page.getByLabel('Last name');
    this.saveBtn = page.getByRole('button', { name: 'Save' });
  }

  editProfile = async (email: string, firstName: string, lastName: string) => {
    await this.email.fill(email);
    await this.firstName.fill(firstName);
    await this.lastName.fill(lastName);
    await this.saveBtn.click();
  };
}
