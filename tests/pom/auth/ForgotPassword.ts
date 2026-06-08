import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

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
    const responded = this.page.waitForResponse(
      (res) =>
        res.url().includes('/users/forgot-password') &&
        res.request().method() === 'POST',
    );
    await this.submitBtn.click();
    await responded;
  }

  async fetchResetLink(email: string) {
    const linkTitle = 'Reset password';
    const resetLink = await getAnchorFromLastRecievedEmail(email, linkTitle);
    expect(resetLink.textContent?.trim()).toBe(linkTitle);
    return resetLink.href;
  }
}
