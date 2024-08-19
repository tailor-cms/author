import { analyzePageWithAxe } from './helpers/analyzePageWithAxe';
import { Catalog } from '../../pom/catalog/Catalog';
import SeedClient from '../../api/SeedClient';
import { test } from './helpers/axe-config';

test.beforeEach(async () => {
  await SeedClient.resetDatabase();
});

test('a11y check of an empty catalog', async ({
  page,
  makeAxeBuilder,
}, testInfo) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await analyzePageWithAxe(
    page,
    makeAxeBuilder,
    'a11y-catalog-page-report',
    testInfo,
  );
});

test('a11y check of an seeded catalog', async ({
  page,
  makeAxeBuilder,
}, testInfo) => {
  await SeedClient.seedCatalog();
  await page.goto('/', { waitUntil: 'networkidle' });
  const catalog = new Catalog(page);
  await catalog.orderByName();
  await page.waitForLoadState('networkidle');
  await analyzePageWithAxe(
    page,
    makeAxeBuilder,
    'a11y-seeded-catalog-page-report',
    testInfo,
  );
});
