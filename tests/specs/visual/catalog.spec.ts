import { test } from '@playwright/test';

import { Catalog } from '../../pom/catalog/Catalog';
import { percySnapshot } from '../../utils/percy.ts';
import SeedClient from '../../api/SeedClient';

test.beforeEach(async () => {
  await SeedClient.resetDatabase();
});

test('Should take a snapshot of an empty catalog', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await percySnapshot(page, 'Empty catalog page');
});

test('Should take a snapshot of an seeded catalog', async ({ page }) => {
  await SeedClient.seedCatalog();
  await page.goto('/', { waitUntil: 'networkidle' });
  const catalog = new Catalog(page);
  await catalog.orderByName();
  await page.waitForLoadState('networkidle');
  await percySnapshot(page, 'Seeded catalog page');
});
