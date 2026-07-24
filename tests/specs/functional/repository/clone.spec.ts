import type { Page } from '@playwright/test';

import {
  GeneralSettings,
  RepositoryGroups,
  RepositoryMembers,
  SettingsSidebar,
} from '../../../pom/repository/RepositorySettings';
import {
  createCleanRepository,
  toSeededRepositorySettings,
} from '../../../helpers/seed';
import { expect, test } from '@playwright/test';
import { Catalog } from '../../../pom/catalog/Catalog';
import { CloneDialog } from '../../../pom/repository/CloneDialog';
import { ADMIN_TEST_USER, DEFAULT_TEST_USER } from '../../../fixtures/auth';
import { RepositoryCard } from '../../../pom/catalog/RepositoryCard';
import { Toast } from '../../../pom/common/Toast';
import SeedClient from '../../../api/SeedClient';

const GROUP_NAME = 'Clone Share Group';
const CLONE_NAME = 'Cloned Repository';

test.beforeEach(async () => {
  await SeedClient.resetDatabase();
});

// Repository shared with a user group.
const seedSharedRepository = async () => {
  const { data } = await SeedClient.seedUser({
    email: 'clone_group_member@gostudion.com',
    userGroup: { name: GROUP_NAME },
  });
  return createCleanRepository('Clone Source', [data.userGroup.id]);
};

// Individually assigned member
const addSourceMember = async (page: Page, repositoryId: number) => {
  await page.goto(RepositoryMembers.getRoute(repositoryId));
  await new RepositoryMembers(page).addUser(DEFAULT_TEST_USER.email, 'Author');
};

const openCloneDialog = async (page: Page, repositoryId: number) => {
  await page.goto(GeneralSettings.getRoute(repositoryId));
  await new GeneralSettings(page).rail.runAction('Clone');
  return new CloneDialog(page);
};

// Reach the clone's settings the way a user would: catalog card cog,
// then the settings sidebar.
const openCloneSettings = async (page: Page) => {
  await page.goto('/');
  const catalog = new Catalog(page);
  const card = new RepositoryCard(
    page,
    catalog.findRepositoryCard(CLONE_NAME),
  );
  await card.openSettings();
  return new SettingsSidebar(page);
};

test('should be able to clone the repository', async ({ page }) => {
  await toSeededRepositorySettings(page);
  const settingsPage = new GeneralSettings(page);
  await settingsPage.rail.runAction('Clone');
  const cloneDialog = new CloneDialog(page);
  await cloneDialog.expectTitle('Clone Course');
  await cloneDialog.clone(CLONE_NAME);
  await new Toast(page).expectCloned('Course');
  await page.goto('/');
  await expect(page.getByText(CLONE_NAME)).toBeVisible();
});

test('shares the clone with the same people when enabled', async ({
  page,
}) => {
  const repository = await seedSharedRepository();
  await addSourceMember(page, repository.id);
  const dialog = await openCloneDialog(page, repository.id);
  await expect(dialog.shareSwitch).toBeEnabled();
  await expect(dialog.shareSwitch).not.toBeChecked();
  await dialog.clone(CLONE_NAME, undefined, true);
  await new Toast(page).expectCloned('Course');
  const sidebar = await openCloneSettings(page);
  await sidebar.open('Groups');
  const groups = new RepositoryGroups(page);
  await expect(groups.getEntryByName(GROUP_NAME)).toBeVisible();
  await sidebar.open('Members');
  const members = new RepositoryMembers(page);
  await expect(members.getEntryByEmail(DEFAULT_TEST_USER.email)).toBeVisible();
});

test('shares the clone when cloning from a catalog card', async ({ page }) => {
  const repository = await seedSharedRepository();
  await page.goto('/');
  const catalog = new Catalog(page);
  const card = new RepositoryCard(
    page,
    catalog.findRepositoryCard(repository.name),
  );
  await card.runAction('Clone');
  const dialog = new CloneDialog(page);
  await expect(dialog.shareSwitch).toBeEnabled();
  await dialog.clone(CLONE_NAME, undefined, true);
  await new Toast(page).expectCloned('Course');
  const sidebar = await openCloneSettings(page);
  await sidebar.open('Groups');
  const groups = new RepositoryGroups(page);
  await expect(groups.getEntryByName(GROUP_NAME)).toBeVisible();
});

test('does not share the clone by default', async ({ page }) => {
  const repository = await seedSharedRepository();
  await addSourceMember(page, repository.id);
  const dialog = await openCloneDialog(page, repository.id);
  await dialog.clone(CLONE_NAME);
  await new Toast(page).expectCloned('Course');
  const sidebar = await openCloneSettings(page);
  await sidebar.open('Groups');
  await expect(page.getByText('No associated user groups.')).toBeVisible();
  await sidebar.open('Members');
  const members = new RepositoryMembers(page);
  // Only the cloning admin; the source's Author must not carry over.
  await expect(members.userEntriesLocator).toHaveCount(1);
  await expect(members.getEntryByEmail(ADMIN_TEST_USER.email)).toBeVisible();
});

test('share option is disabled when the source is not shared', async ({
  page,
}) => {
  await toSeededRepositorySettings(page);
  const settingsPage = new GeneralSettings(page);
  await settingsPage.rail.runAction('Clone');
  const dialog = new CloneDialog(page);
  // The dialog resolves who has access on mount;
  await expect(dialog.shareHint).toHaveText(/isn't shared with anyone else/);
  await expect(dialog.shareSwitch).toBeDisabled();
});
