import { expect, test } from '@playwright/test';

import { Catalog } from '../../../pom/catalog/Catalog';
import {
  createCleanRepository,
  createUserGroup,
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

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
