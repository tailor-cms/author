import mockRepositories from 'tailor-seed/repositories.json';
import { test } from '@playwright/test';

import { EndpointClient, getEndpointClient } from '../../api/client';
import { Catalog } from '../../pom/catalog/Catalog';
import { percySnapshot } from '../../utils/percy.ts';

let REPOSITORY_API: EndpointClient;

const seedCatalog = async () => {
  return Promise.all(
    mockRepositories.map((it) => REPOSITORY_API.create(it as any)),
  );
};

const cleanupCatalog = async (repositories) => {
  for (const repository of repositories) {
    await REPOSITORY_API.remove(repository.id);
  }
};

test.beforeAll(async ({ baseURL }) => {
  if (!baseURL) throw new Error('baseURL is required');
  REPOSITORY_API = await getEndpointClient(baseURL, '/api/repositories/');
});

test.beforeEach(async ({ page }) => {
  const { data } = await REPOSITORY_API.list();
  const { items: repositories } = data;
  if (repositories.length) await cleanupCatalog(repositories);
  await page.goto('/', { waitUntil: 'networkidle' });
});

test('Should take a snapshot of an empty catalog', async ({ page }) => {
  await percySnapshot(page, 'Empty catalog page');
});

test('Should take a snapshot of an seeded catalog', async ({ page }) => {
  await seedCatalog();
  await page.reload({ waitUntil: 'networkidle' });
  const catalog = new Catalog(page);
  await catalog.orderByName();
  await page.waitForTimeout(2000);
  await percySnapshot(page, 'Seeded catalog page');
});
