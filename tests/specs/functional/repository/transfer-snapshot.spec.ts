// the fixture's schema (`TEST_TRANSFER`) is NOT in the
// bundled `@tailor-cms/config` registry. The import processor must
// register it as an extra (paste-mode); every downstream consumer
// then resolves it through the standard `schema.getXxx(...)` API.
// The test drills from the catalog card all the way to the rendered
// element content - if any layer skipped the augmentation, render
// breaks here.
import { expect, test } from '@playwright/test';
import { faker } from '@faker-js/faker';

import { ActivityOutline } from '../../../pom/repository/Outline';
import { AddRepositoryDialog } from '../../../pom/catalog/AddRepository';
import { Catalog } from '../../../pom/catalog/Catalog';
import { NavigationRail } from '../../../pom/repository/NavigationRail';
import { Toast } from '../../../pom/common/Toast';
import SeedClient from '../../../api/SeedClient';

const FIXTURE = './fixtures/test_schema_transfer.tgz';
const ACTIVITY_NAME = 'Example entry';
const ELEMENT_TEXT = 'Hello world!';

test.beforeEach(async ({ page }) => {
  await SeedClient.resetDatabase();
  await page.goto('/');
});

test('imports & renders a repository whose schema is not in the registry',
  async ({ page }) => {
    const name = `Snapshot ${faker.lorem.word()} ${Date.now()}`;
    const description = faker.lorem.sentence(4);
    const dialog = new AddRepositoryDialog(page);
    await dialog.open();
    await dialog.submitImport(name, description, FIXTURE);
    await new Toast(page).expectImportSucceeded();
    const catalog = new Catalog(page);
    const card = catalog.findRepositoryCard(name);
    await expect(card).toBeVisible();
    await card.click();
    const outline = new ActivityOutline(page);
    await expect(outline.el).toBeVisible({ timeout: 15000 });
    const item = await outline.getOutlineItemByName(ACTIVITY_NAME);
    await item.openBtn.click();
    await expect(page.getByText(ELEMENT_TEXT)).toBeVisible({ timeout: 10000 });
  },
);

test('clones a repository whose schema is embedded', async ({ page }) => {
  const name = `Snapshot ${faker.lorem.word()} ${Date.now()}`;
  const dialog = new AddRepositoryDialog(page);
  await dialog.open();
  await dialog.submitImport(name, faker.lorem.sentence(4), FIXTURE);
  // Import toast doubles as the completion wait; the catalog refetches
  await new Toast(page).expectImportSucceeded();
  const catalog = new Catalog(page);
  const card = catalog.findRepositoryCard(name);
  await expect(card).toBeVisible();
  await card.click();
  const outline = new ActivityOutline(page);
  await expect(outline.el).toBeVisible({ timeout: 15000 });
  // Embedded schema resolved - the imported outline items render
  await outline.getOutlineItemByName(ACTIVITY_NAME);
  await new NavigationRail(page).clone('Cloned embedded repository');
  await new Toast(page).expectCloned('Test Transfer');
  await page.goto('/');
  const clonedCard = catalog.findRepositoryCard('Cloned embedded repository');
  await expect(clonedCard).toBeVisible();
  await clonedCard.click();
  await expect(outline.el).toBeVisible({ timeout: 15000 });
  await outline.getOutlineItemByName(ACTIVITY_NAME);
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
