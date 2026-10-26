import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { getDialog, withExactText } from '../../common/utils';
import { ConfirmationDialog } from '../../common/ConfirmationDialog';

export class IntegrationEntry {
  readonly page: Page;
  readonly el: Locator;
  readonly revokeBtn: Locator;

  constructor(page: Page, el: Locator) {
    this.revokeBtn = el.getByRole('button', { name: /^Revoke / });
    this.page = page;
    this.el = el;
  }

  async revoke() {
    await this.revokeBtn.click();
    await new ConfirmationDialog(this.page, 'Revoke integration').confirm();
    await expect(this.el).not.toBeVisible();
  }
}

export class RegisterIntegrationDialog {
  readonly page: Page;
  readonly el: Locator;
  readonly nameInput: Locator;
  readonly keyInput: Locator;
  readonly submitBtn: Locator;
  readonly issued: Locator;
  readonly webhookUrl: Locator;
  readonly doneBtn: Locator;

  constructor(page: Page) {
    const el = getDialog(page, 'Register integration');
    this.issued = getDialog(page, 'Integration registered');
    this.nameInput = el.getByLabel('Name', { exact: true });
    this.keyInput = el.getByLabel('Key', { exact: true });
    this.submitBtn = el.getByRole('button', { name: 'Register', exact: true });
    this.webhookUrl = this.issued.locator('.webhook-url');
    this.doneBtn = this.issued.getByRole('button', {
      name: 'I\'ve saved it',
      exact: true,
    });
    this.page = page;
    this.el = el;
  }

  async submit(name: string, key: string) {
    await expect(this.el).toBeVisible();
    await this.nameInput.fill(name);
    await this.keyInput.fill(key);
    await this.submitBtn.click();
    await expect(this.webhookUrl).toBeVisible();
    const url = (await this.webhookUrl.innerText()).trim();
    await this.doneBtn.click();
    await expect(this.issued).not.toBeVisible();
    return url;
  }
}

export class IntegrationsDialog {
  readonly page: Page;
  readonly el: Locator;
  readonly integrationEntriesLocator: Locator;
  readonly registerBtn: Locator;

  constructor(page: Page) {
    const el = getDialog(page, 'Integrations');
    this.integrationEntriesLocator = el.locator('.integration-row');
    this.registerBtn = el.getByRole('button', {
      name: 'Register',
      exact: true,
    });
    this.page = page;
    this.el = el;
  }

  getEntryLocator(name: string) {
    return withExactText(this.integrationEntriesLocator, name);
  }

  async getEntryByName(name: string) {
    const el = this.getEntryLocator(name).first();
    await expect(el).toBeVisible();
    return new IntegrationEntry(this.page, el);
  }

  async register(name: string, key: string) {
    await this.registerBtn.click();
    const dialog = new RegisterIntegrationDialog(this.page);
    const url = await dialog.submit(name, key);
    await expect(this.getEntryLocator(name)).toBeVisible();
    return url;
  }

  async revoke(name: string) {
    const entry = await this.getEntryByName(name);
    await entry.revoke();
  }
}
