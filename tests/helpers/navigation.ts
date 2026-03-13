import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

import { ContainerList } from '../pom/editor/ContainerList';

export const toStructurePage = async (page: Page, activity: any) => {
  await page.goto(`/repository/${activity.repositoryId}/root/structure`);
  await page.waitForLoadState('networkidle');
  return { activity };
};

export const toEditorPage = async (page: Page, activity: any) => {
  await page.goto(`/repository/${activity.repositoryId}/editor/${activity.id}`);
  const containerList = new ContainerList(page);
  // Wait for either container list or empty linked activity alert to appear
  await expect(
    containerList.el
      .first()
      .or(page.locator('.content-containers-wrapper > .v-alert')),
  ).toBeVisible();
  return { activity };
};
