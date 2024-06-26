import { test } from '@playwright/test';

import { ChangePasswordDialog } from '../../pom/common/ChangePasswordDiaog.ts';
import { percySnapshot } from '../../utils/percy.ts';

test.beforeEach(({ page }) =>
  page.goto('/user/profile', { waitUntil: 'networkidle' }),
);

test('Should take a snapshot of the "Profile" page', async ({ page }) => {
  await percySnapshot(page, 'Profile');
});

test('Should take a snapshot of the "Change Password" dialog', async ({
  page,
}) => {
  const passwordDialog = new ChangePasswordDialog(page);
  await passwordDialog.open();
  await percySnapshot(page, 'Profile - Change Password');
});
