import { Locator, Page } from '@playwright/test';

import { OidcSignIn } from './OidcSignIn';

export class SignIn {
  static route = '/auth';
  readonly page: Page;
  readonly oidcBtn: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly forgotPasswordLink: Locator;
  readonly submitBtn: Locator;
  readonly oidcSignInPage: OidcSignIn;

  constructor(page: Page) {
    this.page = page;
    this.oidcBtn = page.getByTestId('auth_oidcLoginBtn');
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.forgotPasswordLink = page.getByRole('link', {
      name: 'Forgot password?',
    });
    this.submitBtn = page.getByRole('button', { name: 'Sign in', exact: true });
    this.oidcSignInPage = new OidcSignIn(page);
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
    await this.oidcSignInPage.signIn(email, password);
  }
}
