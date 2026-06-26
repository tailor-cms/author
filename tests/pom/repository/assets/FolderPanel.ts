import type { Locator, Page } from '@playwright/test';
import type { AssetToolbar } from './AssetToolbar';

import { ConfirmationDialog } from '../../common/ConfirmationDialog';
import { NewFolderDialog } from './NewFolderDialog';

// The subfolder grid, the breadcrumb trail and the New folder dialog - i.e.
// everything for navigating and managing the asset library's virtual folders.
export class FolderPanel {
  readonly page: Page;
  readonly toolbar: AssetToolbar;
  readonly rows: Locator;
  readonly breadcrumbs: Locator;
  readonly dialog: NewFolderDialog;
  readonly removeAction: Locator;
  readonly deleteAction: Locator;

  constructor(page: Page, toolbar: AssetToolbar) {
    this.page = page;
    this.toolbar = toolbar;
    this.rows = page.locator('.folder-row');
    this.breadcrumbs = page.locator('.folder-breadcrumbs');
    this.dialog = new NewFolderDialog(page);
    const menuItems = page.locator('.v-list .v-list-item');
    this.removeAction = menuItems.filter({ hasText: 'Discard folder' });
    this.deleteAction = menuItems.filter({ hasText: 'Delete folder' });
  }

  row(name: string): Locator {
    return this.rows.filter({ hasText: name });
  }

  async count(): Promise<number> {
    return this.rows.count();
  }

  async create(name: string) {
    await this.toolbar.openNewFolder();
    await this.dialog.create(name);
  }

  async open(name: string) {
    await this.row(name).click();
  }

  async openMenu(name: string) {
    await this.row(name).getByRole('button', { name: 'Folder actions' }).click();
  }

  // Pending (local, empty) folders only: forgets the folder, deletes nothing.
  async remove(name: string) {
    await this.openMenu(name);
    await this.removeAction.click();
  }

  // Server-backed folders: deletes the folder and all assets under it.
  async delete(name: string) {
    await this.openMenu(name);
    await this.deleteAction.click();
    const dialog = new ConfirmationDialog(this.page, 'Delete Folder');
    await dialog.confirm();
  }

  // Click a breadcrumb (e.g. 'Home') to navigate up the folder tree.
  async navigateToCrumb(label: string) {
    await this.breadcrumbs
      .getByRole('button', { name: label, exact: true })
      .click();
  }

  // Click the breadcrumb up-arrow to go up one folder level.
  async navigateUp() {
    await this.breadcrumbs
      .getByRole('button', { name: 'Up one level' })
      .click();
  }
}
