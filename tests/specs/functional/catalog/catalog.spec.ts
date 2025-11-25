import { expect, test } from '@playwright/test';
import mockRepositories from 'tailor-seed/repositories.json' assert { type: 'json' };

import { AddRepositoryDialog } from '../../../pom/catalog/AddRepository';
import { Catalog } from '../../../pom/catalog/Catalog';
import { RepositoryCard } from '../../../pom/catalog/RepositoryCard';
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
  await expect(page.getByText('0 available repositories')).toBeVisible();
});

test('should be able to create a new repository', async ({ page }) => {
  const dialog = new AddRepositoryDialog(page);
  await dialog.open();
  await dialog.createRepository();
});

test('should be able to import a repository', async ({ page }) => {
  const dialog = new AddRepositoryDialog(page);
  await dialog.open();
  const { name } = await dialog.importRepository();
  await page.reload();
  await expect(page.getByText(name)).toBeVisible({ timeout: 10000 });
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
  await expect(page.getByText('No matches found')).toBeVisible();
});

test('should show message in case of no pinned repositories', async ({
  page,
}) => {
  const catalog = new Catalog(page);
  await catalog.pinnedFilterBtn.click();
  await expect(catalog.getRepositoryCards()).toHaveCount(0);
  await expect(page.getByText('0 pinned items')).toBeVisible();
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
