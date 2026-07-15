import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { confirmAction, selectMenuOption } from '../common/utils';
import { GroupDialog } from '../admin/GroupManagement';

export const ALL_WORKSPACES = 'All workspaces';

export class WorkspaceRail {
  readonly page: Page;
  readonly el: Locator;
  readonly addBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.el = page.locator('.workspace-rail');
    this.addBtn = this.el.getByRole('button', { name: 'Create workspace' });
  }

  tile(name: string): Locator {
    // `has` is matched relative to each tile, so it must be page-rooted.
    return this.el
      .locator('.workspace-tile')
      .filter({ has: this.page.getByRole('button', { name, exact: true }) });
  }

  tileAvatar(name: string): Locator {
    return this.tile(name).getByRole('button', { name, exact: true });
  }

  select(name: string) {
    return this.tileAvatar(name).click();
  }

  selectAll() {
    return this.select(ALL_WORKSPACES);
  }

  async expectActive(name: string) {
    await expect(this.tileAvatar(name)).toHaveAttribute('aria-pressed', 'true');
  }

  async create(name: string) {
    await this.addBtn.click();
    const dialog = new GroupDialog(this.page);
    await dialog.enterName(name);
    await dialog.save();
  }

  // Kebab only reveals on hover.
  async openActions(name: string) {
    await this.tile(name).hover();
    await this.tile(name)
      .getByRole('button', { name: 'Workspace actions' })
      .click();
  }

  async manage(name: string) {
    await this.openActions(name);
    await selectMenuOption(this.page, 'Manage');
  }

  async edit(name: string, newName: string) {
    await this.openActions(name);
    await selectMenuOption(this.page, 'Edit');
    const dialog = new GroupDialog(this.page);
    await dialog.enterName(newName);
    await dialog.save();
  }

  async delete(name: string) {
    await this.openActions(name);
    await selectMenuOption(this.page, 'Delete');
    await confirmAction(this.page);
  }
}
