import { expect, test } from '@playwright/test';
import mockRepositories from 'tailor-seed/repositories.json' assert { type: 'json' };

import { AddRepositoryDialog } from '../../../pom/catalog/AddRepository';
import { Catalog } from '../../../pom/catalog/Catalog';
import { CloneDialog } from '../../../pom/repository/CloneDialog';
import { createCleanRepository } from '../../../helpers/seed';
import { ExportDialog } from '../../../pom/repository/ExportDialog';
import { RepositoryCard } from '../../../pom/catalog/RepositoryCard';
import { Toast } from '../../../pom/common/Toast';
import SeedClient from '../../../api/SeedClient';

test.beforeEach(async ({ page }) => {
  await SeedClient.resetDatabase();
  await page.goto('/');
});

test('catalog page has a page title set', async ({ page }) => {
  await expect(page).toHaveTitle(/Catalog/);
});

test(`should have 'no available repositories' message visible`, async ({
  page,
}) => {
  await expect(page.getByText('No repositories yet')).toBeVisible();
});

test('should be able to create a new repository', async ({ page }) => {
  const dialog = new AddRepositoryDialog(page);
  await dialog.open();
  await dialog.createRepository();
  await new Toast(page).expectCreated('Course');
});

test('should be able to import a repository', async ({ page }) => {
  const dialog = new AddRepositoryDialog(page);
  await dialog.open();
  const { name } = await dialog.submitImport();
  await new Toast(page).expectImportSucceeded();
  await page.reload();
  await expect(page.getByText(name)).toBeVisible({ timeout: 10000 });
});

test('should be able to publish a repository from its card', async ({
  page,
}) => {
  const { data } = await SeedClient.seedTestRepository();
  await page.reload();
  const catalog = new Catalog(page);
  const card = new RepositoryCard(
    page,
    catalog.findRepositoryCard(data.repository.name),
  );
  await card.publish();
  await new Toast(page).expectPublished('Course');
  await expect(card.el.getByLabel('Published')).toBeVisible();
});

test('should be able to clone a repository from its card', async ({
  page,
}) => {
  const { data } = await SeedClient.seedTestRepository();
  await page.reload();
  const catalog = new Catalog(page);
  const card = new RepositoryCard(
    page,
    catalog.findRepositoryCard(data.repository.name),
  );
  await card.runAction('Clone');
  const cloneDialog = new CloneDialog(page);
  await cloneDialog.expectTitle('Clone Course');
  await cloneDialog.clone('Cloned From Card');
  await new Toast(page).expectCloned('Course');
  await expect(catalog.findRepositoryCard('Cloned From Card')).toBeVisible();
});

test('should be able to export a repository from its card', async ({
  page,
}) => {
  const { data } = await SeedClient.seedTestRepository();
  await page.reload();
  const catalog = new Catalog(page);
  const card = new RepositoryCard(
    page,
    catalog.findRepositoryCard(data.repository.name),
  );
  await card.runAction('Export');
  await new ExportDialog(page).download();
  await new Toast(page).expectExported('Course');
});

test('should be able to delete a repository from its card', async ({
  page,
}) => {
  const { data } = await SeedClient.seedTestRepository();
  await page.reload();
  const catalog = new Catalog(page);
  const card = new RepositoryCard(
    page,
    catalog.findRepositoryCard(data.repository.name),
  );
  await card.delete();
  await new Toast(page).expectDeleted('Course');
  await expect(page.getByText('No repositories yet')).toBeVisible();
});

test('should be able to bulk delete repositories', async ({ page }) => {
  await createCleanRepository('Bulk Delete A');
  await createCleanRepository('Bulk Delete B');
  await page.reload();
  const catalog = new Catalog(page);
  await catalog.bulkDelete('Bulk Delete A', 'Bulk Delete B');
  await new Toast(page).expectDeletedMany('2 Courses');
  await expect(page.getByText('No repositories yet')).toBeVisible();
});

test('should be able to load repositories', async ({ page }) => {
  await SeedClient.seedCatalog();
  await page.reload();
  const catalog = new Catalog(page);
  // Pagination limit is 18
  await expect(catalog.getRepositoryCards()).toHaveCount(18);
});

test('should be able to load all repositories', async ({ page }) => {
  await SeedClient.seedCatalog();
  await page.reload();
  const catalog = new Catalog(page);
  // Pagination limit is 18
  await expect(catalog.getRepositoryCards()).toHaveCount(18);
  await catalog.loadMore();
  await expect(catalog.getRepositoryCards()).toHaveCount(
    mockRepositories.length,
  );
});

test('should be able to order by name', async ({ page }) => {
  await SeedClient.seedCatalog();
  await page.reload();
  const catalog = new Catalog(page);
  await catalog.orderByName();
  await page.waitForTimeout(1000);
  expect(await catalog.getFirstRepositoryCard().textContent()).toContain(
    'Astronomy',
  );
});

test('should be able to order by asc / desc', async ({ page }) => {
  await SeedClient.seedCatalog();
  await page.reload();
  const catalog = new Catalog(page);
  await catalog.orderByName();
  await catalog.orderDirectionBtn.click();
  await page.waitForTimeout(500);
  expect(await catalog.getFirstRepositoryCard().textContent()).toContain(
    'Physics',
  );
});

test('should be able to pin repository and filter by pinned repositories', async ({
  page,
}) => {
  await SeedClient.seedCatalog();
  await page.reload();
  const catalog = new Catalog(page);
  const repositoryCard = new RepositoryCard(
    page,
    catalog.getFirstRepositoryCard(),
  );
  await repositoryCard.pinBtn.click();
  await catalog.pinnedFilterBtn.click();
  await expect(catalog.getRepositoryCards()).toHaveCount(1);
});

test('should be able to search by name', async ({ page }) => {
  await SeedClient.seedCatalog();
  await page.reload();
  const catalog = new Catalog(page);
  await catalog.searchInput.fill('Astrono');
  await expect(catalog.getRepositoryCards()).toHaveCount(1);
});

test('should show a message in case of not matching the search', async ({
  page,
}) => {
  await SeedClient.seedCatalog();
  await page.reload();
  const catalog = new Catalog(page);
  await catalog.searchInput.fill('sdasdassdas');
  await expect(catalog.getRepositoryCards()).toHaveCount(0);
  await expect(page.getByText('No matches')).toBeVisible();
});

test('should show message in case of no pinned repositories', async ({
  page,
}) => {
  await SeedClient.seedCatalog();
  await page.reload();
  const catalog = new Catalog(page);
  await catalog.pinnedFilterBtn.click();
  await expect(catalog.getRepositoryCards()).toHaveCount(0);
  await expect(page.getByText('No pinned repositories')).toBeVisible();
});

test('should be able to tag a repository', async ({ page }) => {
  await SeedClient.seedCatalog();
  await page.reload();
  const catalog = new Catalog(page);
  const repositoryCard = new RepositoryCard(
    page,
    catalog.getFirstRepositoryCard(),
  );
  await repositoryCard.addTag('tag1');
  await expect(repositoryCard.el.getByText('tag1')).toBeVisible();
});

test('should be able to filter by tag', async ({ page }) => {
  await SeedClient.seedCatalog();
  await page.reload();
  const catalog = new Catalog(page);
  const repositoryCard = new RepositoryCard(
    page,
    catalog.getFirstRepositoryCard(),
  );
  await repositoryCard.addTag('tag1');
  await catalog.filterByTag('tag1');
  await expect(catalog.getRepositoryCards()).toHaveCount(1);
});

test('should be able to delete a tag', async ({ page }) => {
  await SeedClient.seedCatalog();
  await page.reload();
  const catalog = new Catalog(page);
  const repositoryCard = new RepositoryCard(
    page,
    catalog.getFirstRepositoryCard(),
  );
  await repositoryCard.addTag('tag1');
  await expect(repositoryCard.el.getByText('tag1')).toBeVisible();
  await repositoryCard.removeTag('tag1');
  // TODO: Check why reload is needed for the CI run
  await page.reload();
  await expect(page.getByText('tag1')).not.toBeVisible();
});

test('should be able to filter by schema', async ({ page }) => {
  await SeedClient.seedCatalog();
  await page.reload();
  const catalog = new Catalog(page);
  await catalog.filterBySchema('Course');
  await expect(catalog.getRepositoryCards()).toHaveCount(15);
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
