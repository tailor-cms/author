import { analyzePageWithAxe } from './helpers/analyzePageWithAxe';
import { ChangePasswordDialog } from '../../pom/common/ChangePasswordDiaog.ts';
import { test } from './helpers/axe-config';

test.beforeEach(({ page }) =>
  page.goto('/user/profile', { waitUntil: 'networkidle' }),
);

test('a11y check of the "Profile" page', async ({
  page,
  makeAxeBuilder,
}, testInfo) => {
  await analyzePageWithAxe(
    page,
    makeAxeBuilder,
    'a11y-profile-page-report',
    testInfo,
  );
});

test.skip('a11y check of the "Change Password" dialog', async ({
  page,
  makeAxeBuilder,
}, testInfo) => {
  const passwordDialog = new ChangePasswordDialog(page);
  await passwordDialog.open();
  await analyzePageWithAxe(
    page,
    makeAxeBuilder,
    'a11y-change-password-report',
    testInfo,
  );
});
