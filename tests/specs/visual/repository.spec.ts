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

test('Take a snapshot of the repository structure page', async ({ page }) => {
  await percySnapshot(page, 'Repository structure page');
});

test.only('Take a snapshot of the settings page', async ({ page }) => {
  const tabNavigation = page.getByTestId('repositoryRoot_nav');
  await tabNavigation.getByText('Settings').click();
  await page.waitForLoadState('networkidle');
  await percySnapshot(page, 'Repository settings page');
});
