import { ForgotPassword, SignIn } from '../../pom/auth';
import { analyzePageWithAxe } from './helpers/analyzePageWithAxe';
import { test } from './helpers/axe-config';

test.beforeEach(({ page }) => page.goto('/', { waitUntil: 'networkidle' }));

test('a11y check of the "Sign In" page', async ({
  page,
  makeAxeBuilder,
}, testInfo) => {
  const signInPage = new SignIn(page);
  await signInPage.visit();
  await analyzePageWithAxe(
    page,
    makeAxeBuilder,
    'a11y-auth-page-report',
    testInfo,
  );
});

test('a11y check of the "Forgot password?" page', async ({
  page,
  makeAxeBuilder,
}, testInfo) => {
  const forgotPasswordPage = new ForgotPassword(page);
  await forgotPasswordPage.visit();
  await analyzePageWithAxe(
    page,
    makeAxeBuilder,
    'a11y-forgot-password-page-report',
    testInfo,
  );
});
