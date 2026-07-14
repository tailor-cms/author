import { expect, test } from '@playwright/test';

import { AppBar } from '../../../pom/common/AppBar.ts';
import { DEFAULT_TEST_USER } from '../../../fixtures/auth.ts';
import SeedClient from '../../../api/SeedClient.ts';
import { revokeAccess } from '../../../helpers/access.ts';
import { toSeededRepository } from '../../../helpers/seed.ts';

const REVOKED_NAME = 'Revoked Repository';

test.beforeEach(async () => {
  await SeedClient.resetDatabase();
});

test('drops a repository the user lost access to from recents', async ({
  page,
}) => {
  // Authored by the default user, so they can visit it and it lands in recents.
  const { repository: revoked } = await toSeededRepository(
    page,
    REVOKED_NAME,
    DEFAULT_TEST_USER.email,
  );
  await toSeededRepository(page, 'Current Repository', DEFAULT_TEST_USER.email);
  await revokeAccess(revoked.id, DEFAULT_TEST_USER.email);
  const appBar = new AppBar(page);
  await appBar.openRepositorySwitcher();
  await expect(appBar.repositoryItem(REVOKED_NAME)).toHaveCount(0);
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
