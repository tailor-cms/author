import { expect, Locator, Page } from '@playwright/test';

import { ContainerList } from './ContainerList';
import { ContentElement } from './ContentElement';
import { EditorSidebar } from './Sidebar';

export class Editor {
  readonly page: Page;
  readonly sidebar: EditorSidebar;
  readonly topToolbar: Locator;
  readonly primaryPageName = 'History of Pizza';
  readonly primaryPageContent = 'The story of pizza begins';
  readonly secondaryPageName = 'Different Pizza Styles Around the World';
  readonly containerList: ContainerList;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = new EditorSidebar(page);
    this.topToolbar = this.page.locator('.activity-toolbar');
    this.containerList = new ContainerList(page);
  }

  async toPrimaryPage() {
    await this.sidebar.navigateTo(this.primaryPageName);
    await expect(this.topToolbar).toContainText(this.primaryPageName);
    await expect(this.page.getByText(this.primaryPageContent)).toBeVisible();
  }

  async toSecondaryPage() {
    await this.sidebar.navigateTo(this.secondaryPageName);
    await expect(this.topToolbar).toContainText(this.secondaryPageName);
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
    await page.getByRole('button', { name: 'Add content' }).click();
    await page.getByRole('button', { name: 'HTML' }).click();
    // Temporary using the first one / assuming container is empty before adding
    await page.locator('.content-element').click();
    await page.locator('.tiptap').fill(content);
    // Focusout element to trigger the save
    await sidebar.el.focus();
    await expect(page.locator('.v-snackbar')).toHaveText('Element saved');
    await page.waitForLoadState('networkidle');
  }

  async removeContentElements() {
    const containers = await this.containerList.getContainers();
    for (const container of containers) {
      await container.deleteElements();
    }
  }
}
