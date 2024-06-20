import { expect, Locator, Page } from '@playwright/test';

export class ChangePasswordDialog {
  readonly page: Page;
  readonly openDialogBtn: Locator;
  readonly dialog: Locator;
  readonly currentPasswordInput: Locator;
  readonly newPasswordInput: Locator;
  readonly passwordConfirmationInput: Locator;
  readonly saveBtn: Locator;
  readonly cancelBtn: Locator;
  readonly status: Locator;
  readonly alert: Locator;

  constructor(page: Page) {
    this.page = page;
    // Dialog activator
    this.openDialogBtn = page.getByRole('button', { name: 'Change password' });
    // Dialog internals
    const dialog = this.page.getByRole('dialog');
    this.dialog = dialog;
    this.currentPasswordInput = dialog.getByLabel('Current password');
    this.newPasswordInput = dialog.getByLabel('New password', { exact: true });
    this.passwordConfirmationInput = dialog.getByLabel('Confirm new password');
    this.saveBtn = dialog.getByRole('button', { name: 'Save' });
    this.cancelBtn = dialog.getByRole('button', { name: 'Cancel' });
    this.status = page.getByRole('status');
    this.alert = page.getByRole('alert');
  }

  open() {
    return this.openDialogBtn.click();
  }

  fillCurrentPassword(password: string) {
    return this.currentPasswordInput.fill(password);
  }

  fillNewPassword(password: string) {
    return this.newPasswordInput.fill(password);
  }

  fillPasswordConfirmation(password: string) {
    return this.passwordConfirmationInput.fill(password);
  }

  save() {
    return this.saveBtn.click();
  }

  cancel() {
    return this.cancelBtn.click();
  }

  hasVisibleStatusMessage(message: string | RegExp) {
    return expect(this.status.getByText(message)).toBeVisible();
  }

  hasVisibleAlert(message: string | RegExp) {
    return expect(this.alert.getByText(message)).toBeVisible();
  }
}
