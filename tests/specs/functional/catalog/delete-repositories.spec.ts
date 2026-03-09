import { expect, test } from '@playwright/test';

import { Catalog } from '../../../pom/catalog/Catalog';
import { ConfirmationDialog } from '../../../pom/common/ConfirmationDialog';
import SeedClient from '../../../api/SeedClient';

test.beforeEach(async ({ page }) => {
  await SeedClient.resetDatabase();
  await SeedClient.seedCatalog();
  await page.goto('/', { waitUntil: 'networkidle' });
  const catalog = new Catalog(page);
  await expect(catalog.getRepositoryCards().first()).toBeVisible();
});

test('should be able to toggle delete mode on and off', async ({ page }) => {
  const catalog = new Catalog(page);
  await expect(catalog.selectAllCheckbox).not.toBeVisible();
  await catalog.toggleDeleteMode();
  await expect(catalog.selectAllCheckbox).toBeVisible();
  await expect(catalog.deleteSelectedBtn).toBeVisible();
  await expect(catalog.deleteSelectedBtn).toBeDisabled();
  await expect(catalog.getCardCheckboxes().first()).toBeVisible();
  await catalog.toggleDeleteMode();
  await expect(catalog.selectAllCheckbox).not.toBeVisible();
  await expect(catalog.getCardCheckboxes()).toHaveCount(0);
});

test('should be able to select individual repositories', async ({ page }) => {
  const catalog = new Catalog(page);
  await catalog.toggleDeleteMode();
  await catalog.getCardCheckbox('Astronomy').click();
  await expect(catalog.deleteSelectedBtn).toContainText('(1)');
  await catalog.getCardCheckbox('Physics').click();
  await expect(catalog.deleteSelectedBtn).toContainText('(2)');
  await catalog.getCardCheckbox('Astronomy').click();
  await expect(catalog.deleteSelectedBtn).toContainText('(1)');
});

test('should be able to select and deselect all repositories', async ({
  page,
}) => {
  const catalog = new Catalog(page);
  await catalog.toggleDeleteMode();
  const cardCount = await catalog.getRepositoryCards().count();
  await catalog.selectAllCheckbox.click();
  await expect(
    catalog.deleteSelectedBtn,
  ).toContainText(`(${cardCount})`);
  await catalog.selectAllCheckbox.click();
  await expect(catalog.deleteSelectedBtn).toBeDisabled();
});

test('should clear selection when exiting delete mode', async ({ page }) => {
  const catalog = new Catalog(page);
  await catalog.toggleDeleteMode();
  await catalog.getCardCheckbox('Astronomy').click();
  await expect(catalog.deleteSelectedBtn).toContainText('(1)');
  // Exit and re-enter delete mode
  await catalog.toggleDeleteMode();
  await catalog.toggleDeleteMode();
  await expect(catalog.deleteSelectedBtn).toBeDisabled();
});

test('should show confirmation dialog before deleting', async ({ page }) => {
  const catalog = new Catalog(page);
  const initialCount = await catalog.getRepositoryCards().count();
  await catalog.toggleDeleteMode();
  await catalog.getCardCheckbox('Astronomy').click();
  await catalog.deleteSelectedBtn.click();
  const dialog = new ConfirmationDialog(page, 'Delete repository');
  await expect(dialog.el).toBeVisible();
  await dialog.close();
  await expect(dialog.el).not.toBeVisible();
  // All repositories should still be present after cancelling
  await expect(catalog.getRepositoryCards()).toHaveCount(initialCount);
});

test('should delete selected repositories after confirmation', async ({
  page,
}) => {
  const catalog = new Catalog(page);
  await catalog.toggleDeleteMode();
  await catalog.getCardCheckbox('Astronomy').click();
  await catalog.deleteSelectedBtn.click();
  const dialog = new ConfirmationDialog(page, 'Delete repository');
  await expect(dialog.el).toBeVisible();
  await dialog.confirm();
  await expect(dialog.el).not.toBeVisible();
  await page.waitForLoadState('networkidle');
  await expect(catalog.findRepositoryCard('Astronomy')).toHaveCount(0, {
    timeout: 10000,
  });
  await expect(catalog.selectAllCheckbox).not.toBeVisible();
});

test('should delete multiple selected repositories', async ({ page }) => {
  const catalog = new Catalog(page);
  await catalog.toggleDeleteMode();
  await catalog.getCardCheckbox('Astronomy').click();
  await catalog.getCardCheckbox('Physics').click();
  await expect(catalog.deleteSelectedBtn).toContainText('(2)');
  await catalog.deleteSelectedBtn.click();
  const dialog = new ConfirmationDialog(page, 'Delete repositories');
  await expect(dialog.el).toBeVisible();
  await expect(dialog.el).toContainText('2 repositories');
  await dialog.confirm();
  await expect(dialog.el).not.toBeVisible();
  await page.waitForLoadState('networkidle');
  await expect(catalog.findRepositoryCard('Astronomy')).toHaveCount(0, {
    timeout: 10000,
  });
  await expect(catalog.findRepositoryCard('Physics')).toHaveCount(0);
});

test('should clear selection when searching', async ({ page }) => {
  const catalog = new Catalog(page);
  await catalog.toggleDeleteMode();
  await catalog.getCardCheckbox('Astronomy').click();
  await expect(catalog.deleteSelectedBtn).toContainText('(1)');
  await catalog.searchInput.fill('test');
  await expect(catalog.deleteSelectedBtn).toBeDisabled();
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
