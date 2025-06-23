import type { Locator, Page } from '@playwright/test';

export class OidcSignIn {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('#username');
    this.passwordInput = page.locator('#password');
    this.submitBtn = page.getByRole('button', {
      name: /^(continue|sign in|submit|log in)$/i,
    });
  }

  fillEmail(email) {
    return this.emailInput.fill(email);
  }

  fillPassword(password) {
    return this.passwordInput.fill(password);
  }

  async signIn(email?: string, password?: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submitBtn.click();
  }
}
