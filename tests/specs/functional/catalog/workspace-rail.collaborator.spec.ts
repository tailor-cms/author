import { expect, test } from '@playwright/test';

import { COLLAB_TEST_USER } from '../../../fixtures/auth.ts';
import { WorkspaceRail } from '../../../pom/catalog/WorkspaceRail.ts';
import SeedClient from '../../../api/SeedClient.ts';

const WORKSPACE_NAME = 'Test';

const seedMembership = async (role: 'ADMIN' | 'COLLABORATOR') => {
  await SeedClient.resetDatabase();
  await SeedClient.seedUser({
    email: COLLAB_TEST_USER.email,
    userGroup: { name: WORKSPACE_NAME, role },
  });
};

test.describe('as a group admin', () => {
  test.beforeEach(async () => {
    await seedMembership('ADMIN');
  });

  test('rail offers member management but not entity actions', async ({
    page,
  }) => {
    await page.goto('/');
    const rail = new WorkspaceRail(page);
    await expect(rail.el).toBeVisible();
    // Group admins manage members but can't create/rename/delete workspaces.
    await expect(rail.addBtn).not.toBeVisible();
    expect(await rail.getActionLabels(WORKSPACE_NAME)).toEqual(['Manage']);
  });
});

test.describe('as a plain group member', () => {
  test.beforeEach(async () => {
    await seedMembership('COLLABORATOR');
  });

  test('rail shows the workspace but exposes no actions', async ({ page }) => {
    await page.goto('/');
    const rail = new WorkspaceRail(page);
    await expect(rail.el).toBeVisible();
    await expect(rail.tileAvatar(WORKSPACE_NAME)).toBeVisible();
    // A non-admin group member has no actions menu at all.
    await expect(rail.actionsButton(WORKSPACE_NAME)).toHaveCount(0);
  });
});
