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

  // Preview (filled state) — FilePreview renders a VTextField whose
  // model-value is the file name; locate it via the native input value.
  getPreview(fileName: string): Locator {
    return this.el.locator('.v-text-field', {
      has: this.page.locator(`input[value="${fileName}"]`),
    });
  }

  async expectFileSet(fileName: string) {
    await expect(this.getPreview(fileName)).toBeVisible();
  }

  async download(fileName: string) {
    const downloadBtn = this.getPreview(fileName)
      .getByRole('button', { name: 'Download file' });
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      downloadBtn.click(),
    ]);
    return download;
  }
}
