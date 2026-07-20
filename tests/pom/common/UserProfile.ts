import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class UserProfile {
  static route = '/user/profile';
  readonly page: Page;
  readonly emailInput: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly saveBtn: Locator;
  readonly cancelBtn: Locator;
  readonly alert: Locator;
  readonly status: Locator;
  readonly avatar: Locator;
  readonly uploadAvatarBtn: Locator;
  readonly photoInput: Locator;
  readonly deleteAvatarBtn: Locator;
  readonly cropPreview: Locator;
  readonly applyCropBtn: Locator;
  readonly confirmationDialog: Locator;
  readonly confirmDeleteBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.firstNameInput = page.getByLabel('First Name');
    this.lastNameInput = page.getByLabel('Last Name');
    this.saveBtn = page.getByRole('button', { name: 'Save' });
    this.cancelBtn = page.getByRole('button', { name: 'Cancel' });
    this.alert = page.getByRole('alert');
    this.status = page.getByRole('status');
    this.avatar = page.getByRole('img', { name: 'Avatar' });
    this.uploadAvatarBtn = page.getByRole('button', {
      name: /Upload avatar|Change avatar/,
    });
    this.photoInput = page.locator('input[name="photo"]');
    this.deleteAvatarBtn = page.getByRole('button', { name: 'Delete avatar' });
    this.cropPreview = page.getByRole('img', { name: 'Crop preview' });
    this.applyCropBtn = page.getByRole('button', { name: 'Apply' });
    const confirmationDialog = page.getByRole('dialog');
    this.confirmationDialog = confirmationDialog;
    this.confirmDeleteBtn = confirmationDialog.getByRole('button', {
      name: 'Confirm',
    });
  }

  fillEmail(email: string) {
    return this.emailInput.fill(email);
  }

  fillFirstName(firstName: string) {
    return this.firstNameInput.fill(firstName);
  }

  fillLastName(lastName: string) {
    return this.lastNameInput.fill(lastName);
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

  async updateProfile(email: string, firstName: string, lastName: string) {
    await this.fillEmail(email);
    await this.fillFirstName(firstName);
    await this.fillLastName(lastName);
    await this.saveBtn.click();
  }

  async uploadProfilePhoto() {
    await this.uploadAvatarBtn.click();
    await this.photoInput.setInputFiles('./fixtures/avatar.jpg');
    await expect(this.cropPreview).toBeVisible();
    await this.applyCropBtn.click();
    await this.hasVisibleStatusMessage(
      'Your profile picture has been updated!',
    );
  }

  async removeProfilePhoto() {
    await this.deleteAvatarBtn.click();
    await expect(this.confirmationDialog).toBeVisible();
    await this.confirmDeleteBtn.click();
    await this.hasVisibleStatusMessage(
      'Your profile picture has been updated!',
    );
  }
}
