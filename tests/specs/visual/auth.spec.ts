import { test } from '@playwright/test';

import { ForgotPassword, SignIn } from './../../pom/auth';
import { percySnapshot } from '../../utils/percy.ts';

test.beforeEach(({ page }) => page.goto('/', { waitUntil: 'networkidle' }));

test('Should take a snapshot of the "Sign In" page', async ({ page }) => {
  const signInPage = new SignIn(page);
  await signInPage.visit();
  await percySnapshot(page, 'Sign in page');
});

test('Should take a snapshot of the "Forgot password?" page', async ({
  page,
}) => {
  const forgotPasswordPage = new ForgotPassword(page);
  await forgotPasswordPage.visit();
  await percySnapshot(page, 'Forgot password page');
});
