import type { TestInfo } from '@playwright/test';
import { test as base } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

type AxeFixture = {
  // auto fixture exposes no value
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  forceColorMode: void;
  makeAxeBuilder: () => AxeBuilder;
};

// Mirrors the app's persisted color-mode storage (see useColorMode.ts).
const COLOR_MODE_STORAGE_KEY = 'tailor:color-mode';

// Extend the base test by providing a "makeAxeBuilder" function.
// This new "test" can be used in multiple test files, ensuring
// that each test gets a consistently configured AxeBuilder instance.
export const test = base.extend<AxeFixture>({
  // Force the theme before any app code runs, so each a11y project can scan a
  // specific color mode. The mode comes from the project's `metadata.colorMode`
  // (set in playwright.config.ts) and defaults to dark.
  forceColorMode: [
    async ({ page }, use, testInfo) => {
      const colorMode =
        (testInfo.project.metadata as { colorMode?: 'light' | 'dark' })
          .colorMode ?? 'dark';
      await page.addInitScript(
        ([key, mode]) => window.localStorage.setItem(key, mode),
        [COLOR_MODE_STORAGE_KEY, colorMode] as const,
      );
      await use();
    },
    { auto: true },
  ],
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
