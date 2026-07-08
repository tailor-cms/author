import { expect } from '@playwright/test';

import {
  outlineLevel,
  outlineSeed,
  toEmptyRepository,
  toSeededRepository,
} from '../../helpers/seed';
import { ActivityOutline } from '../../pom/repository/Outline.ts';
import { NavigationRail } from '../../pom/repository/NavigationRail.ts';
import SeedClient from '../../api/SeedClient';
import { analyzePageWithAxe } from './helpers/analyzePageWithAxe';
import { test } from './helpers/axe-config';

const REPOSITORY_NAME = 'a11y test imported repository';

test('a11y check of the repository structure page', async ({
  page,
  makeAxeBuilder,
}, testInfo) => {
  await toSeededRepository(page, REPOSITORY_NAME);
  await page.getByText(outlineSeed.group.title).isVisible();
  await analyzePageWithAxe(
    page,
    makeAxeBuilder,
    'a11y-respository-structure-report',
    testInfo,
  );
});

test('a11y check of the history page', async ({
  page,
  makeAxeBuilder,
}, testInfo) => {
  await toEmptyRepository(page, REPOSITORY_NAME);
  const outline = new ActivityOutline(page);
  await outline.addFirstItem(outlineLevel.GROUP, 'Module 1');
  await new NavigationRail(page).goToHistory();
  await expect(page.getByText('Created repository')).toBeVisible();
  await expect(page.getByText('Created Module 1 module')).toBeVisible();
  await analyzePageWithAxe(
    page,
    makeAxeBuilder,
    'a11y-history-page-report',
    testInfo,
  );
});

test('a11y check of the progress page', async ({
  page,
  makeAxeBuilder,
}, testInfo) => {
  await toEmptyRepository(page, REPOSITORY_NAME);
  const outline = new ActivityOutline(page);
  await outline.addFirstItem(outlineLevel.GROUP, 'Module 1');
  await new NavigationRail(page).goToProgress();
  await expect(page.getByText('Module 1')).toBeVisible();
  await analyzePageWithAxe(
    page,
    makeAxeBuilder,
    'a11y-progress-page-report',
    testInfo,
  );
});

test('a11y check of the settings page', async ({
  page,
  makeAxeBuilder,
}, testInfo) => {
  await toSeededRepository(page, REPOSITORY_NAME);
  await new NavigationRail(page).goToSettings();
  await page.waitForLoadState('networkidle');
  await analyzePageWithAxe(
    page,
    makeAxeBuilder,
    'a11y-settings-page-report',
    testInfo,
  );
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
