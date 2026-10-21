import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { getAnchorFromLastRecievedEmail } from '../../utils/email';

export class ResetPassword {
  readonly page: Page;
  readonly route: string;
  readonly passwordInput: Locator;
  readonly passwordConfirmationInput: Locator;
  readonly submitBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.passwordInput = page.getByLabel('Password', { exact: true });
    this.passwordConfirmationInput = page.getByLabel('Re-enter password');
    this.submitBtn = page.getByRole('button', { name: 'Change password' });
  }

  fillPassword(passsword: string) {
    return this.passwordInput.fill(passsword);
  }

  fillPasswordConfirmation(passsword: string) {
    return this.passwordConfirmationInput.fill(passsword);
  }

  async resetPassword(password: string) {
    await this.fillPassword(password);
    await this.fillPasswordConfirmation(password);
    // Settle the reset request before returning
    const responded = this.page.waitForResponse(
      (res) =>
        res.url().includes('/users/reset-password') &&
        !res.url().includes('/token-status') &&
        res.request().method() === 'POST',
    );
    await this.submitBtn.click();
    await responded;
  }

  async fetchInviteLink(email: string) {
    const linkTitle = 'Complete registration';
    const resetLink = await getAnchorFromLastRecievedEmail(email, linkTitle);
    expect(resetLink.textContent?.trim()).toBe(linkTitle);
    return resetLink.href;
  }
}
