import { expect, test } from '@playwright/test';

import { Catalog } from '../../../pom/catalog/Catalog';
import { GeneralSettings } from '../../../pom/repository/RepositorySettings';
import { Toast } from '../../../pom/common/Toast';
import {
  createCleanRepository,
  toSeededRepositorySettings,
} from '../../../helpers/seed';
import SeedClient from '../../../api/SeedClient';

test.beforeEach(async ({ page }) => {
  await SeedClient.resetDatabase();
  await toSeededRepositorySettings(page);
});

test('should be able to delete the repository', async ({ page }) => {
  const settingsPage = new GeneralSettings(page);
  await settingsPage.rail.delete();
  await new Toast(page).expectDeleted('Course');
  await expect(page.getByText('No repositories yet')).toBeVisible();
});

test('should be able to export the repository', async ({ page }) => {
  const settingsPage = new GeneralSettings(page);
  await settingsPage.rail.export();
  await new Toast(page).expectExported('Course');
});

test('should be able to publish the repository', async ({ page }) => {
  const settingsPage = new GeneralSettings(page);
  await settingsPage.rail.publish();
  await new Toast(page).expectPublished('Course');
  const repositoryName = await settingsPage.getName();
  await page.goto('/');
  const catalog = new Catalog(page);
  const card = catalog.findRepositoryCard(repositoryName);
  await expect(card).toBeVisible();
  await expect(card.getByLabel('Published')).toBeVisible();
  await expect(card.getByLabel('Has unpublished changes')).not.toBeVisible();
});

test('should be able to edit name', async ({ page }) => {
  const settingsPage = new GeneralSettings(page);
  await settingsPage.updateName('New Name');
  await page.reload();
  await expect(settingsPage.nameInput).toHaveValue('New Name');
});

test('should warn on duplicate name but not when reverting the name', async ({
  page,
}) => {
  const OTHER_NAME = 'Astronomy Basics';
  const settingsPage = new GeneralSettings(page);
  await createCleanRepository(OTHER_NAME);
  // Remount so the duplicate check picks up the newly created repository
  await page.reload();
  await expect(settingsPage.nameInput).toHaveValue(/.+/);
  const originalName = await settingsPage.getName();
  // Another repository's name triggers the duplicate warning
  await settingsPage.nameInput.fill(OTHER_NAME);
  await expect(settingsPage.nameWarning).toBeVisible();
  // The repository's own name does not
  await settingsPage.nameInput.fill(originalName);
  await expect(settingsPage.nameWarning).not.toBeVisible();
  // Rename, then revert to the previously used name
  await settingsPage.updateName('Renamed Course');
  await settingsPage.nameInput.fill(OTHER_NAME);
  await expect(settingsPage.nameWarning).toBeVisible();
  await settingsPage.nameInput.fill(originalName);
  await expect(settingsPage.nameWarning).not.toBeVisible();
});

test('should be able to edit description', async ({ page }) => {
  const settingsPage = new GeneralSettings(page);
  await settingsPage.updateDescription('New Description');
  await page.reload();
  await expect(settingsPage.descriptionInput).toHaveValue('New Description');
});

test('should be able to publish repository info', async ({ page }) => {
  const settingsPage = new GeneralSettings(page);
  await settingsPage.publishInfo();
  await expect(settingsPage.infoPublishedToast).toBeVisible();
});

test('should not publish repository info while a field is invalid', async ({ page }) => {
  const settingsPage = new GeneralSettings(page);
  // Description requires a minimum of 2 characters; a single one is invalid.
  await settingsPage.descriptionInput.fill('a');
  await settingsPage.descriptionInput.blur();
  await expect(
    settingsPage.el.getByText('Description must be at least 2 characters'),
  ).toBeVisible();
  // Publish is blocked: the success toast must not appear.
  await settingsPage.publishInfo();
  await expect(settingsPage.publishBlockedToast).toBeVisible();
  await expect(settingsPage.infoPublishedToast).not.toBeVisible();
});
