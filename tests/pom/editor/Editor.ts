import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { outlineSeed } from '../../helpers/seed';
import { AddElementDialog } from './AddElementDialog';
import { ContainerList } from './ContainerList';
import { ContentElement } from './ContentElement';
import { EditorSidebar } from './Sidebar';
import { SelectElementDialog } from './SelectElementDialog';

export class Editor {
  readonly page: Page;
  readonly copyDialog: SelectElementDialog;
  readonly sidebar: EditorSidebar;
  readonly topToolbar: Locator;
  readonly addElementDialog: AddElementDialog;
  readonly primaryPageName = outlineSeed.primaryPage.title;
  readonly primaryPageContent = outlineSeed.primaryPage.textContent;
  readonly secondaryPageName = outlineSeed.secondaryPage.title;
  readonly primaryElementLabel = 'tiptap html';
  readonly containerList: ContainerList;

  constructor(page: Page) {
    this.page = page;
    this.copyDialog = new SelectElementDialog(page);
    this.sidebar = new EditorSidebar(page);
    this.topToolbar = this.page.locator('.activity-toolbar');
    this.addElementDialog = new AddElementDialog(page);
    this.containerList = new ContainerList(page);
  }

  async toPrimaryPage() {
    await this.sidebar.navigateToPage(this.primaryPageName);
    await expect(this.topToolbar).toContainText(this.primaryPageName);
    await expect(this.page.getByText(this.primaryPageContent)).toBeVisible();
  }

  async toSecondaryPage() {
    await this.sidebar.navigateToPage(this.secondaryPageName);
    await expect(this.topToolbar).toContainText(this.secondaryPageName);
  }

  getElement(content?: string) {
    const element = content
      ? this.page.locator(ContentElement.selector, { hasText: content })
      : this.page.locator(ContentElement.selector).first();
    return new ContentElement(this.page, element);
  }

  async focusElement(content?: string) {
    return this.getElement(content).focus();
  }

  async getElements(): Promise<ContentElement[]> {
    const containers = await this.containerList.getContainers();
    const elements: ContentElement[] = [];
    for (const container of containers) {
      const items = await container.getElements();
      elements.push(...items);
    }
    return elements;
  }

  async addContentElement(content = 'This is a test element') {
    const { page, sidebar } = this;
    await this.addElementDialog.add('HTML');
    // Temporary using the first one / assuming container is empty before adding
    await this.focusElement();
    await page.locator('.tiptap').fill(content);
    // Focusout element to trigger the save
    await sidebar.el.focus();
    await expect(page.locator('.v-snackbar')).toHaveText('Element saved');
    await page.waitForLoadState('networkidle');
  }

  async copyContentElements(pageTitle: string, elementContent?: string) {
    const { page, copyDialog } = this;
    await this.addElementDialog.openCopyDialog();
    await copyDialog.select(pageTitle, elementContent);
    await expect(page.locator('.v-snackbar'))
      .toHaveText(elementContent ? 'Element saved' : 'Elements saved');
    await page.waitForLoadState('networkidle');
  }

  async removeContentElements() {
    const containers = await this.containerList.getContainers();
    for (const container of containers) {
      await container.deleteElements();
    }
  }
}
