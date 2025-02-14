import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AdminSection {
  static userManagementRoute = '/admin/user-management';
  static groupManagementRoute = '/admin/user-groups';
  static structureListRoute = '/admin/structure-types';
  static installedElementsRoute = '/admin/installed-elements';

  private static async visit(page: Page, route: string) {
    await page.goto(route, { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(route);
  }

  static goToUserManagement(page: Page) {
    return AdminSection.visit(page, AdminSection.userManagementRoute);
  }

  static goToGroupManagement(page: Page) {
    return AdminSection.visit(page, AdminSection.groupManagementRoute);
  }

  static goToStructuresPage(page: Page) {
    return AdminSection.visit(page, AdminSection.structureListRoute);
  }

  static goToInstalledElementsList(page: Page) {
    return AdminSection.visit(page, AdminSection.installedElementsRoute);
  }
}
