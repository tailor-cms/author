import { expect, test } from '@playwright/test';

import { AddRepositoryDialog } from '../../pom/catalog/AddRepository';
import { Catalog } from '../../pom/catalog/Catalog';
import { percySnapshot } from '../../utils/percy.ts';

test.beforeEach(async ({ page }) => {
  const catalog = new Catalog(page);
  await catalog.visit();
  const dialog = new AddRepositoryDialog(page);
  await dialog.open();
  const { name } = await dialog.importRepository();
  await page.reload();
  await expect(page.getByText(name)).toBeVisible({ timeout: 10000 });
  await catalog.findRepositoryCard(name).click();
  await page.waitForLoadState('networkidle');
});

test('Should take a snapshot of repository structure page', async ({
  page,
}) => {
  await percySnapshot(page, 'Repository structure page');
});
