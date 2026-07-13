import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class ExportDialog {
  readonly page: Page;
  readonly el: Locator;
  readonly downloadBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.el = page.locator('div[role="dialog"]', { hasText: 'export' });
    this.downloadBtn = this.el.getByRole('button', { name: 'Download' });
  }

  // Wait for the export job to finish, then download the archive
  async download() {
    await expect(this.el.getByText(/export is ready/i)).toBeVisible({
      timeout: 10000,
    });
    const downloadEvent = this.page.waitForEvent('download');
    await this.downloadBtn.click();
    const download = await downloadEvent;
    const path = `tmp/${download.suggestedFilename()}`;
    await download.saveAs(path);
    return path;
  }
}
