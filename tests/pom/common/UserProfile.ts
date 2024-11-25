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
  readonly editBtn: Locator;
  readonly alert: Locator;
  readonly status: Locator;
  readonly avatar: Locator;
  readonly changeAvatarBtn: Locator;
  readonly uploadAvatarBtn: Locator;
  readonly photoInput: Locator;
  readonly deleteAvatarBtn: Locator;
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
    this.changeAvatarBtn = page.getByRole('button', { name: 'Change avatar' });
    this.uploadAvatarBtn = page.getByLabel('Upload avatar');
    this.photoInput = page.locator('input[name="photo"]');
    this.deleteAvatarBtn = page.getByRole('button', { name: 'Delete avatar' });
    const confirmationDialog = page.getByRole('dialog');
    this.confirmationDialog = confirmationDialog;
    this.confirmDeleteBtn = confirmationDialog.getByRole('button', {
      name: 'Confirm',
    });
  }

  async openAvatarMenu() {
    await this.avatar.hover();
    return this.changeAvatarBtn.click();
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
    await this.openAvatarMenu();
    await this.uploadAvatarBtn.click();
    await this.photoInput.setInputFiles('./fixtures/avatar.jpg');
    await this.hasVisibleStatusMessage(
      'Your profile picture has been updated!',
    );
  }

  async removeProfilePhoto() {
    await this.openAvatarMenu();
    await this.deleteAvatarBtn.click();
    await this.confirmationDialog.isVisible();
    await this.confirmDeleteBtn.click();
    await this.hasVisibleStatusMessage(
      'Your profile picture has been updated!',
    );
  }
}
