import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { ConfirmationDialog } from '../common/ConfirmationDialog';

export class ReorderLinkedElementDialog extends ConfirmationDialog {
  constructor(page: Page) {
    super(page, 'Reorder linked element');
  }

  async expectVisible() {
    await expect(this.el).toBeVisible();
    await expect(this.el).toContainText('linked activity');
    await expect(this.el).toContainText('detach');
  }
}
