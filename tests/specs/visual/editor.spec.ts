import { expect, test } from '@playwright/test';

import { Editor } from '../../pom/editor/Editor';
import { percySnapshot } from '../../utils/percy.ts';
import SeedClient from '../../api/SeedClient';

test.beforeEach(async ({ page }) => {
  await SeedClient.resetDatabase();
  const { data } = await SeedClient.seedTestRepository({
    name: 'Visual test imported repository',
  });
  const {
    activity: { repositoryId, id },
  } = data;
  await page.goto(`/repository/${repositoryId}/editor/${id}`);
});

test('Take a snapshot of the editor page', async ({ page }) => {
  await expect(page.getByText('The story of pizza begins')).toBeVisible();
  await page.waitForTimeout(2000);
  await percySnapshot(page, 'Editor page');
});

test('Take a snapshot of the editor page upon editing the HTML CE', async ({
  page,
}) => {
  await page.getByText('The story of pizza begins').isVisible();
  await page.waitForTimeout(2000);
  const editor = new Editor(page);
  await expect(page.getByText(editor.primaryPageContent)).toBeVisible();
  const containers = await editor.containerList.getContainers();
  const elements = await containers[0].getElements();
  await elements[0].el.click();
  // Make sure the sidebar is visible
  await expect(page.getByText('Additional settings')).toBeVisible();
  await percySnapshot(page, 'Editor page - HTML Content Element editing');
});

test('Take a snapshot of the editor page upon adding new Content Element', async ({
  page,
}) => {
  const editor = new Editor(page);
  await editor.toSecondaryPage();
  await expect(
    page.getByText('Click the button below to add content'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Add content' }).click();
  await expect(page.getByText('Content Elements')).toBeVisible();
  await percySnapshot(page, 'Editor page - Add content element dialog');
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
