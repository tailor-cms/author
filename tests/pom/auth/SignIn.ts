import { Locator, Page } from '@playwright/test';

export class SignIn {
  static route = '/auth';
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly forgotPasswordLink: Locator;
  readonly submitBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.forgotPasswordLink = page.getByRole('link', {
      name: 'Forgot password?',
    });
    this.submitBtn = page.getByRole('button', { name: 'Sign in' });
  }

  visit() {
    return this.page.goto(SignIn.route);
  }

  fillEmail(email) {
    return this.emailInput.fill(email);
  }

  fillPassword(password) {
    return this.passwordInput.fill(password);
  }

  async signIn(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submitBtn.click();
  }
}
