import { expect, test } from '@playwright/test';

import { Catalog } from '../../../pom/catalog/Catalog';
import { ConfirmationDialog } from '../../../pom/common/ConfirmationDialog';
import SeedClient from '../../../api/SeedClient';

test.beforeEach(async ({ page }) => {
  await SeedClient.resetDatabase();
  await SeedClient.seedCatalog();
  await page.goto('/');
});

test('should be able to toggle delete mode on and off', async ({ page }) => {
  const catalog = new Catalog(page);
  // Delete mode controls should not be visible initially
  await expect(catalog.selectAllCheckbox).not.toBeVisible();
  // Enable delete mode
  await catalog.toggleDeleteMode();
  await expect(catalog.selectAllCheckbox).toBeVisible();
  await expect(catalog.deleteSelectedBtn).toBeVisible();
  await expect(catalog.deleteSelectedBtn).toBeDisabled();
  // Checkboxes should appear on repository cards
  await expect(catalog.getCardCheckboxes().first()).toBeVisible();
  // Disable delete mode
  await catalog.toggleDeleteMode();
  await expect(catalog.selectAllCheckbox).not.toBeVisible();
  await expect(catalog.getCardCheckboxes()).toHaveCount(0);
});

test('should be able to select individual repositories', async ({ page }) => {
  const catalog = new Catalog(page);
  await catalog.toggleDeleteMode();
  // Click checkbox on first card
  const firstCardCheckbox = catalog.getCardCheckboxes().nth(0);
  await firstCardCheckbox.click();
  await expect(page.getByRole('button', { name: 'Delete (1)' })).toBeVisible();
  // Click checkbox on second card
  const secondCardCheckbox = catalog.getCardCheckboxes().nth(1);
  await secondCardCheckbox.click();
  await expect(page.getByRole('button', { name: 'Delete (2)' })).toBeVisible();
  // Deselect first card
  await firstCardCheckbox.click();
  await expect(page.getByRole('button', { name: 'Delete (1)' })).toBeVisible();
});

test('should be able to select and deselect all repositories', async ({
  page,
}) => {
  const catalog = new Catalog(page);
  await catalog.toggleDeleteMode();
  const cardCount = await catalog.getRepositoryCards().count();
  // Select all
  await catalog.selectAllCheckbox.click();
  await expect(
    page.getByRole('button', { name: `Delete (${cardCount})` }),
  ).toBeVisible();
  // Deselect all
  await catalog.selectAllCheckbox.click();
  await expect(catalog.deleteSelectedBtn).toBeDisabled();
});

test('should clear selection when exiting delete mode', async ({ page }) => {
  const catalog = new Catalog(page);
  await catalog.toggleDeleteMode();
  // Select a card
  await catalog.getCardCheckboxes().nth(0).click();
  await expect(page.getByRole('button', { name: 'Delete (1)' })).toBeVisible();
  // Exit and re-enter delete mode
  await catalog.toggleDeleteMode();
  await catalog.toggleDeleteMode();
  // Selection should be cleared
  await expect(catalog.deleteSelectedBtn).toBeDisabled();
});

test('should show confirmation dialog before deleting', async ({ page }) => {
  const catalog = new Catalog(page);
  await catalog.toggleDeleteMode();
  await catalog.getCardCheckboxes().nth(0).click();
  await catalog.deleteSelectedBtn.click();
  // Confirmation dialog should appear
  const dialog = new ConfirmationDialog(page, 'Delete repository');
  await expect(dialog.el).toBeVisible();
  // Cancel should close dialog and keep repositories
  await dialog.close();
  await expect(dialog.el).not.toBeVisible();
  const cardCount = await catalog.getRepositoryCards().count();
  expect(cardCount).toBeGreaterThan(0);
});

test('should delete selected repositories after confirmation', async ({
  page,
}) => {
  const catalog = new Catalog(page);
  const initialCount = await catalog.getRepositoryCards().count();
  await catalog.toggleDeleteMode();
  // Select first repository
  await catalog.getCardCheckboxes().nth(0).click();
  await catalog.deleteSelectedBtn.click();
  // Confirm deletion
  const dialog = new ConfirmationDialog(page, 'Delete repository');
  await dialog.confirm();
  // Wait for deletion to complete and page to update
  await page.waitForLoadState('networkidle');
  // Should have one less repository and exit delete mode
  await expect(catalog.getRepositoryCards()).toHaveCount(initialCount - 1);
  await expect(catalog.selectAllCheckbox).not.toBeVisible();
});

test('should delete multiple selected repositories', async ({ page }) => {
  const catalog = new Catalog(page);
  const initialCount = await catalog.getRepositoryCards().count();
  await catalog.toggleDeleteMode();
  // Select first two repositories
  await catalog.getCardCheckboxes().nth(0).click();
  await catalog.getCardCheckboxes().nth(1).click();
  await expect(page.getByRole('button', { name: 'Delete (2)' })).toBeVisible();
  await catalog.deleteSelectedBtn.click();
  // Confirm deletion
  const dialog = new ConfirmationDialog(page, 'Delete repository');
  await expect(dialog.el).toContainText('2 repositories');
  await dialog.confirm();
  await page.waitForLoadState('networkidle');
  await expect(catalog.getRepositoryCards()).toHaveCount(initialCount - 2);
});

test('should clear selection when searching', async ({ page }) => {
  const catalog = new Catalog(page);
  await catalog.toggleDeleteMode();
  await catalog.getCardCheckboxes().nth(0).click();
  await expect(page.getByRole('button', { name: 'Delete (1)' })).toBeVisible();
  // Search should clear selection
  await catalog.searchInput.fill('test');
  await expect(catalog.deleteSelectedBtn).toBeDisabled();
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
