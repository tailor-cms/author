import { expect, test } from '@playwright/test';

import { confirmAction } from '../../pom/common/utils.ts';
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

test('snapshot of the editor page', async ({ page }) => {
  await expect(page.getByText('The story of pizza begins')).toBeVisible();
  await page.waitForTimeout(2000);
  await percySnapshot(page, 'Editor page');
});

test('snapshot of the editor page upon editing the HTML CE', async ({
  page,
}) => {
  const editor = new Editor(page);
  await expect(page.getByText(editor.primaryPageContent)).toBeVisible();
  const containers = await editor.containerList.getContainers();
  const elements = await containers[0].getElements();
  await elements[0].el.click();
  // Make sure the sidebar is visible
  await expect(page.getByText('Additional settings')).toBeVisible();
  await percySnapshot(page, 'Editor page - HTML Content Element editing');
});

test('snapshot of the editor page upon adding new Content Element', async ({
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

test('snapshot of the editor page comments section', async ({ page }) => {
  const editor = new Editor(page);
  await editor.toSecondaryPage();
  await page.getByRole('tab', { name: 'Comments' }).click();
  await expect(page.getByText('Be the First to Comment!')).toBeVisible();
  await percySnapshot(page, 'Editor page - Comments section');
});

test('snapshot of the editor page displaying the publish diff', async ({
  page,
}) => {
  const editor = new Editor(page);
  await editor.toSecondaryPage();
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  await confirmAction(page);
  await editor.addContentElement('This is a test');
  // Wait for the changes to be saved
  await page.waitForTimeout(1000);
  await page.reload();
  await page.getByLabel('Compare with published').click();
  await percySnapshot(page, 'Editor page - publish diff');
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
