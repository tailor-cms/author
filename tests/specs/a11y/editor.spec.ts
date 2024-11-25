import { expect } from '@playwright/test';

import { confirmAction } from '../../pom/common/utils.ts';
import { Editor } from '../../pom/editor/Editor';
import SeedClient from '../../api/SeedClient';
import { analyzePageWithAxe } from './helpers/analyzePageWithAxe';
import { test } from './helpers/axe-config';

test.beforeEach(async ({ page }) => {
  await SeedClient.resetDatabase();
  const { data } = await SeedClient.seedTestRepository({
    name: 'a11y test imported repository',
  });
  const {
    activity: { repositoryId, id },
  } = data;
  await page.goto(`/repository/${repositoryId}/editor/${id}`);
});

test('a11y check of the editor page', async ({
  page,
  makeAxeBuilder,
}, testInfo) => {
  await expect(page.getByText('The story of pizza begins')).toBeVisible();
  await page.waitForTimeout(2000);
  await analyzePageWithAxe(
    page,
    makeAxeBuilder,
    'a11y-editor-page-report',
    testInfo,
  );
});

test('a11y check of the editor page upon editing the Content Element', async ({
  page,
  makeAxeBuilder,
}, testInfo) => {
  const editor = new Editor(page);
  await expect(page.getByText(editor.primaryPageContent)).toBeVisible();
  const containers = await editor.containerList.getContainers();
  const elements = await containers[0].getElements();
  await elements[0].el.click();
  // Make sure the sidebar is visible
  await expect(page.getByText('Additional settings')).toBeVisible();
  await analyzePageWithAxe(
    page,
    makeAxeBuilder,
    'a11y-editing-content-element-report',
    testInfo,
  );
});

test('a11y check of the editor page upon adding new Content Element', async ({
  page,
  makeAxeBuilder,
}, testInfo) => {
  const editor = new Editor(page);
  await editor.toSecondaryPage();
  await expect(
    page.getByText('Click the button below to add content'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Add content' }).click();
  await expect(page.getByText('Content Elements')).toBeVisible();
  await analyzePageWithAxe(
    page,
    makeAxeBuilder,
    'a11y-adding-content-element-report',
    testInfo,
  );
});

test('a11y check of the editor page comments section', async ({
  page,
  makeAxeBuilder,
}, testInfo) => {
  const editor = new Editor(page);
  await editor.toSecondaryPage();
  await page.getByRole('tab', { name: 'Comments' }).click();
  await expect(page.getByText('Be the First to Comment!')).toBeVisible();
  await analyzePageWithAxe(
    page,
    makeAxeBuilder,
    'a11y-comment-section-report',
    testInfo,
  );
});

test('a11y check of the editor page displaying the publish diff', async ({
  page,
  makeAxeBuilder,
}, testInfo) => {
  const editor = new Editor(page);
  await editor.toSecondaryPage();
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  await confirmAction(page);
  await editor.addContentElement('This is a test');
  // Wait for the changes to be saved
  await page.waitForTimeout(1000);
  await page.reload();
  await page.getByLabel('Compare with published').click();
  await analyzePageWithAxe(
    page,
    makeAxeBuilder,
    'a11y-publish-diff-report',
    testInfo,
  );
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
