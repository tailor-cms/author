import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { FileInputPicker } from './FileInputPicker';

export class FileInput {
  readonly page: Page;
  readonly el: Locator;
  readonly picker: FileInputPicker;

  constructor(page: Page, el: Locator) {
    this.page = page;
    this.el = el;
    this.picker = new FileInputPicker(page);
  }

  // Preview (filled state)
  getPreview(fileName: string): Locator {
    return this.el.locator('.file-preview', {
      has: this.page.locator('.file-name', { hasText: fileName }),
    });
  }

  async expectFileSet(fileName: string) {
    await expect(this.getPreview(fileName)).toBeVisible();
  }

  async download(fileName: string) {
    const downloadBtn = this.getPreview(fileName)
      .getByRole('button', { name: 'Download file' });
    const [popup] = await Promise.all([
      this.page.waitForEvent('popup'),
      downloadBtn.click(),
    ]);
    expect(popup.url()).toBeTruthy();
    return popup;
  }
}
