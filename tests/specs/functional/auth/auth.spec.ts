import { expect, test } from '@playwright/test';
import { faker } from '@faker-js/faker';
import userSeed from 'tailor-seed/user.json';

import { EndpointClient, getEndpointClient } from '../../../api/client';
import { ForgotPassword, ResetPassword, SignIn } from '../../../pom/auth';

interface UserData {
  email: string;
  password: string;
}

const getMockUserData = (): UserData => ({
  email: faker.internet.email({ provider: 'gostudion.com' }),
  password: faker.internet.password(),
});

let userAPI: EndpointClient;
const DEFAULT_USER = userSeed[0];

const createUser = async (page): Promise<UserData> => {
  const initialLocation = page.url();
  const userData = getMockUserData();
  await userAPI.create(userData as any);
  const resetPasswordPage = new ResetPassword(page);
  const inviteLink = await resetPasswordPage.fetchInviteLink(userData.email);
  await page.goto(inviteLink);
  await resetPasswordPage.resetPassword(userData.password);
  await page.goto(initialLocation);
  return userData;
};

test.beforeAll(async ({ baseURL }) => {
  userAPI = await getEndpointClient(baseURL, '/api/users');
});

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
});

test('sign in page has a title set', async ({ page }) => {
  const signIn = new SignIn(page);
  await signIn.visit();
  await expect(page).toHaveTitle(/Sign in/);
});

test('should be able to sign in', async ({ page }) => {
  const signInPage = new SignIn(page);
  await signInPage.visit();
  await signInPage.signIn(DEFAULT_USER.email, DEFAULT_USER.password);
  await expect(page).toHaveTitle('Catalog');
});

test('sign in should fail in case of wrong credentials', async ({ page }) => {
  const signInPage = new SignIn(page);
  await signInPage.visit();
  await signInPage.signIn(DEFAULT_USER.email, faker.internet.password());
  await expect(
    page.getByText('The email or password you entered is incorrect.'),
  ).toBeVisible();
});

test('should be able to accept invite and sign in', async ({ page }) => {
  const signInPage = new SignIn(page);
  // Invite user and set the password
  const user = await createUser(page);
  await signInPage.visit();
  await signInPage.signIn(user.email, user.password);
});

test('should be able to reset password', async ({ page }) => {
  // Create new user
  const signInPage = new SignIn(page);
  await signInPage.visit();
  const user = await createUser(page);
  // Navigate to forgot password page from the sign in page
  await signInPage.forgotPasswordLink.click();
  await expect(page).toHaveTitle('Request password reset');
  const forgotPasswordPage = new ForgotPassword(page);
  await forgotPasswordPage.requestPasswordReset(user.email);
  // Fetch reset link from email
  const resetLink = await forgotPasswordPage.fetchResetLink(user.email);
  await page.goto(resetLink);
  // Set new password
  const resetPasswordPage = new ResetPassword(page);
  const newPassword = faker.internet.password();
  await resetPasswordPage.resetPassword(newPassword);
  await signInPage.signIn(user.email, newPassword);
  await expect(page).toHaveTitle('Catalog');
});

test.afterAll(async () => {
  // Delete all newly created users
  await userAPI.dispose();
});