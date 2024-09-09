import { Locator, Page } from '@playwright/test';

import { OIDCSignIn } from './OIDCSignIn';

export class SignIn {
  static route = '/auth';
  readonly page: Page;
  readonly oidcBtn: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly forgotPasswordLink: Locator;
  readonly submitBtn: Locator;
  readonly OIDCSignIn: OIDCSignIn;

  constructor(page: Page) {
    this.page = page;
    this.oidcBtn = page.getByRole('button', { name: 'Sign in with SSO' });
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.forgotPasswordLink = page.getByRole('link', {
      name: 'Forgot password?',
    });
    this.submitBtn = page.getByRole('button', { name: 'Sign in', exact: true });
    this.OIDCSignIn = new OIDCSignIn(page);
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

  async oidcSignIn(email?: string, password?: string) {
    await this.oidcBtn.click();
    await this.OIDCSignIn.signIn(email, password);
  }
}
