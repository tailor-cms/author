import { expect } from '@playwright/test';

import {
  outlineLevel,
  outlineSeed,
  toEmptyRepository,
  toSeededRepository,
} from '../../helpers/seed';
import { ActivityOutline } from '../../pom/repository/Outline.ts';
import { analyzePageWithAxe } from './helpers/analyzePageWithAxe';
import SeedClient from '../../api/SeedClient';
import { test } from './helpers/axe-config';

const REPOSITORY_NAME = 'Visual test imported repository';

test('a11y check of the repository structure page', async ({
  page,
  makeAxeBuilder,
}, testInfo) => {
  await toSeededRepository(page, REPOSITORY_NAME);
  await page.getByText(outlineSeed.group.title).isVisible();
  await analyzePageWithAxe(
    page,
    makeAxeBuilder,
    'a11y-content-page-report',
    testInfo,
  );
});

test('a11y check of the history page', async ({
  page,
  makeAxeBuilder,
}, testInfo) => {
  await toEmptyRepository(page, REPOSITORY_NAME);
  const outline = new ActivityOutline(page);
  await outline.addRootItem(outlineLevel.GROUP, 'Module 1');
  const tabNavigation = page.getByTestId('repositoryRoot_nav');
  await tabNavigation.getByText('History').click();
  await expect(page.getByText('Created repository')).toBeVisible();
  await expect(page.getByText('Created Module 1 module')).toBeVisible();
  await analyzePageWithAxe(
    page,
    makeAxeBuilder,
    'a11y-content-page-report',
    testInfo,
  );
});

test('a11y check of the progress page', async ({
  page,
  makeAxeBuilder,
}, testInfo) => {
  await toEmptyRepository(page, REPOSITORY_NAME);
  const outline = new ActivityOutline(page);
  await outline.addRootItem(outlineLevel.GROUP, 'Module 1');
  const tabNavigation = page.getByTestId('repositoryRoot_nav');
  await tabNavigation.getByText('Progress').click();
  await expect(page.getByText('Module 1')).toBeVisible();
  await analyzePageWithAxe(
    page,
    makeAxeBuilder,
    'a11y-content-page-report',
    testInfo,
  );
});

test('a11y check of the settings page', async ({
  page,
  makeAxeBuilder,
}, testInfo) => {
  await toSeededRepository(page, REPOSITORY_NAME);
  const tabNavigation = page.getByTestId('repositoryRoot_nav');
  await tabNavigation.getByText('Settings').click();
  await page.waitForLoadState('networkidle');
  await analyzePageWithAxe(
    page,
    makeAxeBuilder,
    'a11y-content-page-report',
    testInfo,
  );
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
