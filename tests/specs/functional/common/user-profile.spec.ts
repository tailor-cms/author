import { expect, test } from '@playwright/test';
import { faker } from '@faker-js/faker';
import userSeed from 'tailor-seed/user.json';

import { ChangePasswordDialog } from '../../../pom/common/ChangePasswordDiaog';
import SeedClient from '../../../api/SeedClient';
import { UserProfile } from '../../../pom/common/UserProfile';

interface UserData {
  email: string;
  firstName: string;
  lastName: string;
}

const getMockUserData = (): UserData => ({
  email: faker.internet.email({ provider: 'gostudion.com' }).toLowerCase(),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
});

test.beforeEach(async ({ page }) => {
  await SeedClient.resetDatabase();
  await page.goto(UserProfile.route);
});

test('should be able to access profile page', async ({ page }) => {
  await expect(page).toHaveTitle('User profile');
});

test('should be able to update user', async ({ page }) => {
  const profilePage = new UserProfile(page);
  const { email, firstName, lastName } = getMockUserData();
  await profilePage.updateProfile(email, firstName, lastName);
  await profilePage.hasVisibleStatusMessage('User information updated!');
  await page.reload();
  await expect(profilePage.emailInput).toHaveValue(email);
  await expect(profilePage.firstNameInput).toHaveValue(firstName);
  await expect(profilePage.lastNameInput).toHaveValue(lastName);
});

test('updating user should fail if email already exists', async ({ page }) => {
  const { data: user } = await SeedClient.seedUser();
  const email = user.email.toLowerCase();
  const { firstName, lastName } = getMockUserData();
  const profilePage = new UserProfile(page);
  await profilePage.updateProfile(email, firstName, lastName);
  await profilePage.hasVisibleAlert('Email is already taken');
});

test('updating user should fail if email is invalid', async ({ page }) => {
  const profilePage = new UserProfile(page);
  await profilePage.fillEmail('invalid-email');
  await profilePage.save();
  await profilePage.hasVisibleAlert(/must be a valid email/);
});

test('updating user should fail if required fields are empty', async ({
  page,
}) => {
  const profilePage = new UserProfile(page);
  await profilePage.fillEmail('');
  await profilePage.fillFirstName('');
  await profilePage.fillLastName('');
  await profilePage.save();
  await profilePage.hasVisibleAlert('Email is a required field');
  await profilePage.hasVisibleAlert('First name is a required field');
  await profilePage.hasVisibleAlert('Last name is a required field');
});

// eslint-disable-next-line max-len
test('updating user should fail if first or last name are less than two characters', async ({
  page,
}) => {
  const profilePage = new UserProfile(page);
  await profilePage.fillFirstName(faker.string.alpha(1));
  await profilePage.fillLastName(faker.string.alpha(1));
  await profilePage.save();
  await profilePage.hasVisibleAlert('First name must be at least 2 characters');
  await profilePage.hasVisibleAlert('Last name must be at least 2 characters');
});

test('should be able to update profile photo', async ({ page }) => {
  const profilePage = new UserProfile(page);
  await profilePage.uploadProfilePhoto();
});

test('should be able to remove profile photo', async ({ page }) => {
  const profilePage = new UserProfile(page);
  await profilePage.removeProfilePhoto();
});

test('updating password should fail if required fields are empty', async ({
  page,
}) => {
  const passwordDialog = new ChangePasswordDialog(page);
  await passwordDialog.open();
  await passwordDialog.save();
  await passwordDialog.hasVisibleAlert('Current password is a required field');
  await passwordDialog.hasVisibleAlert('New password is a required field');
  await passwordDialog.hasVisibleAlert(
    'Password confirmation is a required field',
  );
});

test('updating password should fail if new password is same as current', async ({
  page,
}) => {
  const passwordDialog = new ChangePasswordDialog(page);
  await passwordDialog.open();
  await passwordDialog.fillCurrentPassword(userSeed[0].password);
  await passwordDialog.fillNewPassword(userSeed[0].password);
  await passwordDialog.fillPasswordConfirmation(userSeed[0].password);
  await passwordDialog.save();
  await passwordDialog.hasVisibleAlert(
    'New password must be different from the current',
  );
});

test('updating password should fail if password confirmation does not match', async ({
  page,
}) => {
  const passwordDialog = new ChangePasswordDialog(page);
  await passwordDialog.open();
  await passwordDialog.fillCurrentPassword(userSeed[0].password);
  await passwordDialog.fillNewPassword(faker.internet.password());
  await passwordDialog.fillPasswordConfirmation(faker.internet.password());
  await passwordDialog.save();
  await passwordDialog.hasVisibleAlert('Password confirmation does not match');
});

test('updating password should fail if current password is incorrect', async ({
  page,
}) => {
  const passwordDialog = new ChangePasswordDialog(page);
  await passwordDialog.open();
  await passwordDialog.fillCurrentPassword(faker.internet.password());
  const newPassword = faker.internet.password();
  await passwordDialog.fillNewPassword(newPassword);
  await passwordDialog.fillPasswordConfirmation(newPassword);
  await passwordDialog.save();
  await passwordDialog.hasVisibleStatusMessage('Failed to change password!');
});

test('should be able to update password', async ({ page }) => {
  const passwordDialog = new ChangePasswordDialog(page);
  await passwordDialog.open();
  await passwordDialog.fillCurrentPassword(userSeed[0].password);
  const newPassword = faker.internet.password();
  await passwordDialog.fillNewPassword(newPassword);
  await passwordDialog.fillPasswordConfirmation(newPassword);
  await passwordDialog.save();
  await expect(page).toHaveTitle('Sign in');
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
