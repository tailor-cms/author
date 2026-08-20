import type { Locator, Page } from '@playwright/test';

import { NavigationRail } from './NavigationRail';
import { Toast } from '../common/Toast';

export const getInfoRoute = (id: number) => `/repository/${id}/root/info`;

// The repository info form ("Settings" rail item) at /root/info.
export class RepositoryInfo {
  static getRoute = getInfoRoute;

  readonly page: Page;
  readonly el: Locator;
  readonly rail: NavigationRail;
  readonly nameInput: Locator;
  readonly nameWarning: Locator;
  readonly descriptionInput: Locator;
  readonly publishInfoBtn: Locator;
  readonly infoPublishedToast: Locator;
  readonly publishBlockedToast: Locator;
  readonly toast: Toast;

  constructor(page: Page) {
    const el = page.locator('.repository-info');
    this.rail = new NavigationRail(page);
    this.toast = new Toast(page);
    this.page = page;
    this.el = el;
    this.nameInput = el.getByLabel('Name');
    this.nameWarning = el.getByText('a Repository with that name already exists');
    this.descriptionInput = el.getByLabel('Description');
    this.publishInfoBtn = el.getByRole('button', { name: 'Publish info' });
    this.infoPublishedToast = page.getByText('Info successfully published');
    this.publishBlockedToast = page.getByText(
      'Please fix the highlighted errors before publishing',
    );
  }

  getName() {
    return this.page.getByLabel('Name').inputValue();
  }

  publishInfo() {
    return this.publishInfoBtn.click();
  }

  async updateName(name: string) {
    await this.nameInput.fill(name);
    await this.nameInput.blur();
    await this.toast.isSaved();
  }

  async updateDescription(description: string) {
    await this.descriptionInput.fill(description);
    await this.descriptionInput.blur();
    await this.toast.isSaved();
  }
}
