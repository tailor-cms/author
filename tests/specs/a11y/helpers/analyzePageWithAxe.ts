import type { Page, TestInfo } from '@playwright/test';
import { expect } from '@playwright/test';
import type { AxeBuilder } from '@axe-core/playwright';

import { attachViolations } from './axe-config';

export const analyzePageWithAxe = async (
  page: Page,
  makeAxeBuilder: () => AxeBuilder,
  reportName: string,
  testInfo: TestInfo,
) => {
  // Analyze the page with axe
  const a11yScanResults = await makeAxeBuilder().analyze();
  const { violations } = a11yScanResults;
  expect(violations).toEqual([]);
  // Attach violations to the test report
  await attachViolations(violations, reportName, testInfo);
};
