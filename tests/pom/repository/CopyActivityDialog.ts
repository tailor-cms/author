import type { Page } from '@playwright/test';

import { SourceContentDialog } from './SourceContentDialog';

export class CopyActivityDialog extends SourceContentDialog {
  constructor(page: Page) {
    super(page, { title: 'Copy existing', action: /^Copy/ });
  }

  copy() {
    return this.submitSelection();
  }

  selectAndCopy(repositoryName: string, activityName: string) {
    return this.selectAndSubmit(repositoryName, activityName);
  }
}
