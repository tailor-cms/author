import type { Page } from '@playwright/test';

import { SourceContentDialog } from './SourceContentDialog';

export class LinkContentDialog extends SourceContentDialog {
  constructor(page: Page) {
    super(page, { title: 'Link existing content', action: /^Link/ });
  }

  link() {
    return this.submitSelection();
  }

  selectAndLink(repositoryName: string, activityName: string) {
    return this.selectAndSubmit(repositoryName, activityName);
  }
}
