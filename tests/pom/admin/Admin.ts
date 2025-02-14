import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AdminSection {
  static userManagementRoute = '/admin/user-management';
  static groupManagementRoute = '/admin/user-groups';
  static structureListRoute = '/admin/structure-types';
  static installedElementsRoute = '/admin/installed-elements';

  private static async visit(page: Page, route: string, validate = false) {
    await page.goto(route, { waitUntil: 'networkidle' });
    if (validate) await expect(page).toHaveURL(route);
  }

  static goToUserManagement(
    page: Page,
    options: { validate: boolean } = { validate: false },
  ) {
    return AdminSection.visit(
      page,
      AdminSection.userManagementRoute,
      options.validate,
    );
  }

  static goToGroupManagement(
    page: Page,
    options: { validate: boolean } = { validate: false },
  ) {
    return AdminSection.visit(
      page,
      AdminSection.groupManagementRoute,
      options.validate,
    );
  }

  static goToStructuresPage(
    page: Page,
    options: { validate: boolean } = { validate: false },
  ) {
    return AdminSection.visit(
      page,
      AdminSection.structureListRoute,
      options.validate,
    );
  }

  static goToInstalledElementsList(
    page: Page,
    options: { validate: boolean } = { validate: false },
  ) {
    return AdminSection.visit(
      page,
      AdminSection.installedElementsRoute,
      options.validate,
    );
  }
}
