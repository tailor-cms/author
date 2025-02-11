import { expect, test } from '@playwright/test';

import { AddRepositoryDialog } from '../../../pom/catalog/AddRepository.ts';
import SeedClient from '../../../api/SeedClient.ts';
import { COLLAB_TEST_USER } from '../../../fixtures/auth.ts';

test.beforeAll(async () => {
  await SeedClient.resetDatabase();
  await SeedClient.seedUser({
    email: COLLAB_TEST_USER.email,
    userGroup: { name: 'Test', role: 'ADMIN' },
  });
});

test(
  'as a Collaborator, added to a Group as Admin, I should be able to create Repository',
  async ({
    page,
  }) => {
    await page.goto('/');
    const dialog = new AddRepositoryDialog(page);
    await expect(dialog.openDialogBtn).toBeVisible();
    await dialog.open();
    await dialog.createRepository();
  });
