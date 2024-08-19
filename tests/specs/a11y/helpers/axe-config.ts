import { test as base, TestInfo } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

type AxeFixture = {
  makeAxeBuilder: () => AxeBuilder;
};

// Extend the base test by providing a "makeAxeBuilder" function.
// This new "test" can be used in multiple test files, ensuring
// that each test gets a consistently configured AxeBuilder instance.
export const test = base.extend<AxeFixture>({
  makeAxeBuilder: async ({ page }, use) => {
    const makeAxeBuilder = () =>
      new AxeBuilder({ page })
        .withTags(['wcag21aa'])
        .withRules(['color-contrast']);
    await use(makeAxeBuilder);
  },
});

/**
 * Attach accessibility violations to the test report.
 *
 * @param {any[]} violations - The array of violations found by AxeBuilder.
 * @param {string} reportName - The name of the report.
 * @param {TestInfo} testInfo - The test information object provided by Playwright.
 * @returns {Promise<void>}
 */
export function attachViolations(
  violations: any[],
  reportName: string,
  testInfo: TestInfo,
) {
  return testInfo.attach(reportName, {
    body: JSON.stringify(violations, null, 2),
    contentType: 'application/json',
  });
}
