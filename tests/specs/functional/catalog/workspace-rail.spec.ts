import { expect, test } from '@playwright/test';

import { Catalog } from '../../../pom/catalog/Catalog';
import {
  createCleanRepository,
  createUserGroup,
  deleteUserGroup,
} from '../../../helpers/seed';
import { WorkspaceRail } from '../../../pom/catalog/WorkspaceRail';
import SeedClient from '../../../api/SeedClient';

test.beforeEach(async () => {
  await SeedClient.resetDatabase();
});

test('filters the catalog by the selected workspace', async ({ page }) => {
  const group = await createUserGroup('Design');
  await createCleanRepository('Inside Design', [group.id]);
  await createCleanRepository('Outside Design');
  await page.goto('/');

  const catalog = new Catalog(page);
  const rail = new WorkspaceRail(page);
  await expect(rail.el).toBeVisible();
  // All workspaces is selected by default and lists every repository.
  await rail.expectActive('All workspaces');
  await expect(catalog.getRepositoryCards()).toHaveCount(2);

  await rail.select('Design');
  await rail.expectActive('Design');
  await expect(catalog.getRepositoryCards()).toHaveCount(1);
  await expect(catalog.findRepositoryCard('Inside Design')).toBeVisible();
  await expect(catalog.findRepositoryCard('Outside Design')).toHaveCount(0);

  await rail.selectAll();
  await expect(catalog.getRepositoryCards()).toHaveCount(2);
});

test('creates a workspace from the rail', async ({ page }) => {
  // The rail only renders once the admin belongs to a workspace.
  await createUserGroup('Existing');
  await page.goto('/');

  const rail = new WorkspaceRail(page);
  await expect(rail.el).toBeVisible();
  await rail.create('Marketing');

  // Creating a workspace opens its management page.
  await expect(page.getByText('Marketing user group')).toBeVisible();
});

test('renames a workspace from its actions menu', async ({ page }) => {
  await createUserGroup('Before');
  await page.goto('/');

  const rail = new WorkspaceRail(page);
  await rail.edit('Before', 'After');

  await expect(rail.tileAvatar('After')).toBeVisible();
  await expect(rail.tileAvatar('Before')).toHaveCount(0);
});

test('opens workspace management from its actions menu', async ({ page }) => {
  await createUserGroup('Managed');
  await page.goto('/');

  const rail = new WorkspaceRail(page);
  await rail.manage('Managed');

  await expect(page.getByText('Managed user group')).toBeVisible();
});

test('deletes a workspace from its actions menu', async ({ page }) => {
  await createUserGroup('Keep');
  await createUserGroup('Remove');
  await page.goto('/');

  const rail = new WorkspaceRail(page);
  await expect(rail.tileAvatar('Remove')).toBeVisible();
  await rail.delete('Remove');

  await expect(rail.tileAvatar('Remove')).toHaveCount(0);
  await expect(rail.tileAvatar('Keep')).toBeVisible();
});

test('remembers the selected workspace across reloads', async ({ page }) => {
  const group = await createUserGroup('Persisted');
  await createCleanRepository('Inside Persisted', [group.id]);
  await createCleanRepository('Outside Persisted');
  await page.goto('/');

  const catalog = new Catalog(page);
  const rail = new WorkspaceRail(page);
  await rail.select('Persisted');
  await rail.expectActive('Persisted');
  await expect(catalog.getRepositoryCards()).toHaveCount(1);

  await page.reload();

  await rail.expectActive('Persisted');
  await expect(catalog.getRepositoryCards()).toHaveCount(1);
});

test('falls back to All when the stored workspace is gone', async ({
  page,
}) => {
  await createUserGroup('Keep');
  const ephemeral = await createUserGroup('Ephemeral');
  await createCleanRepository('Standalone');
  await page.goto('/');

  const rail = new WorkspaceRail(page);
  await rail.select('Ephemeral');
  await rail.expectActive('Ephemeral');

  // Remove the workspace out-of-band (as if another admin deleted it), so the
  // persisted selection is stale on the next load.
  await deleteUserGroup(ephemeral.id);
  await page.reload();

  await rail.expectActive('All workspaces');
  await expect(new Catalog(page).getRepositoryCards()).toHaveCount(1);
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
