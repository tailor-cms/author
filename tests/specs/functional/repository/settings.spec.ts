import { expect, test } from '@playwright/test';

import { Catalog } from '../../../pom/catalog/Catalog';
import { GeneralSettings } from '../../../pom/repository/RepositorySettings';
import SeedClient from '../../../api/SeedClient';
import { toSeededRepositorySettings } from '../../../helpers/seed';

test.beforeEach(async ({ page }) => {
  await SeedClient.resetDatabase();
  await toSeededRepositorySettings(page);
});

test('should be able to delete the repository', async ({ page }) => {
  const settingsPage = new GeneralSettings(page);
  await settingsPage.sidebar.delete();
  await expect(page.getByText('0 available repositories')).toBeVisible();
});

test('should be able to export the repository', async ({ page }) => {
  const settingsPage = new GeneralSettings(page);
  await settingsPage.sidebar.export();
});

test('should be able to clone the repository', async ({ page }) => {
  const settingsPage = new GeneralSettings(page);
  const name = 'Cloned Repository';
  await settingsPage.sidebar.clone(name);
  await page.goto('/');
  await expect(page.getByText(name)).toBeVisible();
});

test('should be able to publish the repository', async ({ page }) => {
  const settingsPage = new GeneralSettings(page);
  await settingsPage.sidebar.publish();
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

test('should be able to edit description', async ({ page }) => {
  const settingsPage = new GeneralSettings(page);
  await settingsPage.updateDescription('New Description');
  await page.reload();
  await expect(settingsPage.descriptionInput).toHaveValue('New Description');
});

test('should be able to publish repository info', async ({ page }) => {
  const settingsPage = new GeneralSettings(page);
  await settingsPage.el.getByRole('button', { name: 'Publish info' }).click();
  await expect(page.getByText('Info successfully published')).toBeVisible();
});
