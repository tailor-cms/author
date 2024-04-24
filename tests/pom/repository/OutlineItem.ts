import { Locator } from '@playwright/test';

export class OutlineItem {
  readonly el: Locator;
  readonly addItemAboveBtn: Locator;
  readonly addItemBelowBtn: Locator;
  readonly addItemIntoBtn: Locator;

  constructor(el: Locator) {
    this.el = el;
    this.addItemAboveBtn = el.getByRole('button', { name: 'Add item above' });
    this.addItemBelowBtn = el.getByRole('button', { name: 'Add item below' });
    this.addItemIntoBtn = el.getByRole('button', { name: 'Add item into' });
  }
}
