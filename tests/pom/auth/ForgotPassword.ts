import { expect, Locator, Page } from '@playwright/test';

import { getAnchorFromLastRecievedEmail } from '../../utils/email';

export class ForgotPassword {
  static route = '/auth/forgot-password';
  readonly page: Page;
  readonly emailInput: Locator;
  readonly submitBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.submitBtn = page.getByRole('button', { name: 'Send reset email' });
  }

  visit() {
    return this.page.goto(ForgotPassword.route);
  }

  fillEmail(email: string) {
    return this.emailInput.fill(email);
  }

  async requestPasswordReset(email: string) {
    await this.fillEmail(email);
    await this.submitBtn.click();
  }

  async fetchResetLink(email: string) {
    const linkTitle = 'Reset password';
    const resetLink = await getAnchorFromLastRecievedEmail(email, linkTitle);
    expect(resetLink.textContent).toBe(linkTitle);
    return resetLink.href;
  }
}
