import type { Locator, Page } from '@playwright/test';

export class WorkflowBoard {
  readonly page: Page;
  readonly el: Locator;
  // All status columns; the status filter narrows these (column focus).
  readonly columns: Locator;

  constructor(page: Page, root: Locator) {
    this.page = page;
    this.el = root.locator('.workflow-board');
    this.columns = this.el.locator('.board-column');
  }

  // All cards across every status column, optionally narrowed by name.
  items(name?: string) {
    const cards = this.el.getByTestId('workflow__boardCard');
    return name ? cards.filter({ hasText: name }) : cards;
  }

  item(name: string) {
    return this.items(name);
  }

  open(name: string) {
    return this.item(name).click();
  }

  // A status column, matched by its header label.
  column(status: string) {
    return this.el.locator('.board-column').filter({
      has: this.page.locator('.board-column__header', { hasText: status }),
    });
  }

  cardsInColumn(status: string) {
    return this.column(status).getByTestId('workflow__boardCard');
  }

  // SortableJS drives on pointer events, so move the card by hand rather than
  // via native HTML5 drag (what locator.dragTo emits, which Sortable ignores).
  async moveToColumn(name: string, status: string) {
    const card = this.item(name);
    await card.hover();
    await this.page.mouse.down();
    // A nudge is needed for Sortable to register the drag start.
    await this.page.mouse.move(0, 0);
    await this.column(status).hover();
    await this.page.mouse.up();
  }
}
