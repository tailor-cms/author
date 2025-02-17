import { expect, test } from '@playwright/test';

import { Catalog } from '../../../pom/catalog/Catalog.ts';
import { COLLAB_TEST_USER } from '../../../fixtures/auth.ts';
import SeedClient from '../../../api/SeedClient.ts';

const USER_GROUP_NAME = 'Test';

test.beforeEach(async () => {
  await SeedClient.resetDatabase();
  // Make sure the user is assigned to a test user group
  await SeedClient.seedUser({
    email: COLLAB_TEST_USER.email,
    userGroup: { name: USER_GROUP_NAME, role: 'ADMIN' },
  });
});

test('should be able to see list of group associated repositories', async ({
  page,
}) => {
  // Associate repositories with the user group
  await SeedClient.seedCatalog({ userGroup: { name: USER_GROUP_NAME } });
  await page.goto('/');
  const catalog = new Catalog(page);
  const PAGINATION_LIMIT = 18;
  await expect(catalog.getRepositoryCards()).toHaveCount(PAGINATION_LIMIT);
});

test('should not be able to see non associated repositories', async ({
  page,
}) => {
  await SeedClient.seedCatalog();
  await page.goto('/');
  await expect(page.getByText('0 available repositories')).toBeVisible();
});
