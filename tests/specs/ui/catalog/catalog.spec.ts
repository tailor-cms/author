import { expect, test } from '@playwright/test';

import { EndpointClient, getEndpointClient } from '../../../api/client';
import { AddRepositoryDialog } from '../../../pom/catalog/AddRepository';
import { Catalog } from '../../../pom/catalog/Catalog';
import { repositories as mockRepositories } from '../../../fixtures/repositories';
import { RepositoryCard } from '../../../pom/catalog/RepositoryCard';

let REPOSITORY_API: EndpointClient;

const seedCatalog = async () => {
  return Promise.all(
    mockRepositories.map((it) => REPOSITORY_API.create(it as any)),
  );
};

const cleanupCatalog = async (repositories) => {
  return Promise.all(repositories.map((it) => REPOSITORY_API.remove(it.id)));
};

test.beforeAll(async ({ baseURL }) => {
  if (!baseURL) throw new Error('baseURL is required');
  REPOSITORY_API = await getEndpointClient(baseURL, '/api/repositories');
});

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  const { data } = await REPOSITORY_API.list();
  const { items: repositories } = data;
  if (repositories.length) await cleanupCatalog(repositories);
  await page.reload();
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
  await seedCatalog();
  await page.reload();
  const catalog = new Catalog(page);
  // Pagination limit is 18
  await expect(catalog.getRepositoryCards()).toHaveCount(18);
});

test('should be able to load all repositories', async ({ page }) => {
  await seedCatalog();
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
  await seedCatalog();
  await page.reload();
  const catalog = new Catalog(page);
  await catalog.orderByName();
  await page.waitForTimeout(1000);
  expect(await catalog.getRepositoryCards().nth(0).textContent()).toContain(
    'Astronomy',
  );
});

test('should be able to order by asc / desc', async ({ page }) => {
  await seedCatalog();
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
  await seedCatalog();
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
  await seedCatalog();
  await page.reload();
  const catalog = new Catalog(page);
  await catalog.searchInput.fill('Astrono');
  await expect(catalog.getRepositoryCards()).toHaveCount(1);
});

test('should show a message in case of not matching the search', async ({
  page,
}) => {
  await seedCatalog();
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
  await seedCatalog();
  await page.reload();
  const catalog = new Catalog(page);
  const repositoryCard = new RepositoryCard(
    page,
    catalog.getFirstRepositoryCard(),
  );
  await repositoryCard.addTag('tag1');
  await expect(repositoryCard.el.getByText('tag1')).toBeVisible();
});

test('should be able to delete a tag', async ({ page }) => {
  await seedCatalog();
  await page.reload();
  const catalog = new Catalog(page);
  const repositoryCard = new RepositoryCard(
    page,
    catalog.getFirstRepositoryCard(),
  );
  await repositoryCard.addTag('tag1');
  await expect(repositoryCard.el.getByText('tag1')).toBeVisible();
  await repositoryCard.removeTag('tag1');
  await expect(repositoryCard.el.getByText('tag1')).not.toBeVisible();
});

test.afterAll(async () => {
  // TODO: Cleanup
});
