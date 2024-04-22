import { test } from '@playwright/test';
import userSeed from 'tailor-seed/user.json';

import { percySnapshot } from '../../utils/percy.ts';
import { SignIn } from './../../pom/auth';

const DEFAULT_USER = userSeed[0];

test.beforeEach(({ page }) => page.goto('/', { waitUntil: 'networkidle' }));

test('Should take a snapshot of the Sign In page', async ({ page }) => {
  const signInPage = new SignIn(page);
  await signInPage.visit();
  await percySnapshot(page, 'Sign in page');
});

test('Should take a snapshot of an empty catalog', async ({ page }) => {
  const signInPage = new SignIn(page);
  await signInPage.visit();
  await signInPage.signIn(DEFAULT_USER.email, DEFAULT_USER.password);
  await percySnapshot(page, 'Empty catalog page');
});
