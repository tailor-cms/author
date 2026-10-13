import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

export interface SuggestionOptions {
  // Typed after the trigger to narrow the menu
  query?: string;
  // Picks the entry with this text rather than the first
  label?: string;
}

// The message authoring component, used for composing new messages and
// editing existing ones.
export class MessageComposer {
  readonly page: Page;
  readonly el: Locator;
  readonly input: Locator;
  readonly postBtn: Locator;
  readonly attachBtn: Locator;
  // Note under the input box
  readonly hint: Locator;
  // Autocomplete suggestion menu, triggered by typing a special character
  readonly suggestionMenu: Locator;
  readonly suggestions: Locator;
  readonly suggestionIcons: Locator;
  // Tokens and code, styled in the box while they are being written
  readonly mentionChips: Locator;
  readonly referenceChips: Locator;
  readonly inlineCode: Locator;
  readonly codeBlocks: Locator;

  constructor(page: Page, parent: Locator) {
    const el = parent.locator('.message-composer');
    this.input = el.getByRole('textbox', { name: 'Message' });
    this.postBtn = el.getByRole('button', { name: 'Post message' });
    this.attachBtn = el.getByRole('button', {
      name: 'Attach a file',
      exact: true,
    });
    this.hint = el.locator('.composer-hint');
    this.suggestionMenu = page.locator('.suggestion-menu');
    this.suggestions = this.suggestionMenu.locator('.v-list-item');
    this.suggestionIcons = this.suggestions.locator(
      '.v-list-item__prepend .v-icon',
    );
    this.mentionChips = el.locator('.composer-chip--mention');
    this.referenceChips = el.locator('.composer-chip--reference');
    this.inlineCode = el.locator('.composer-code');
    this.codeBlocks = el.locator('.composer-code--block');
    this.page = page;
    this.el = el;
  }

  // Attaches a file through the composer.
  async attach(filePath: string) {
    const [fileChooser] = await Promise.all([
      this.page.waitForEvent('filechooser'),
      this.attachBtn.click(),
    ]);
    await fileChooser.setFiles(filePath);
    await expect(this.referenceChips).toBeVisible();
  }

  async write(text: string) {
    await this.input.click();
    await this.input.fill(text);
  }

  // key by key, for autocomplete to work correctly
  async type(text: string) {
    await this.input.click();
    await this.page.keyboard.type(text);
  }

  // Multi-line input
  async typeLines(lines: string[]) {
    await this.input.click();
    for (const [i, line] of lines.entries()) {
      if (i) await this.page.keyboard.press('Shift+Enter');
      await this.page.keyboard.type(line);
    }
  }

  send() {
    return this.postBtn.click();
  }

  async post(text: string) {
    await this.write(text);
    await this.send();
  }

  // Triggers the suggestion menu with the given character and optional query.
  async openSuggestions(trigger: string, query = '') {
    await this.type(`${trigger}${query}`);
    await expect(this.suggestions.first()).toBeVisible();
    return this.suggestions;
  }

  // Covers `@` mentions, `#` references and `:` emoji.
  async selectSuggestion(
    trigger: string,
    { query, label }: SuggestionOptions = {},
  ) {
    const options = await this.openSuggestions(trigger, query);
    const option = label ? options.filter({ hasText: label }) : options;
    await option.first().click();
  }

  // Enter picks the highlighted entry, rather than sending the message.
  async selectSuggestionWithKeyboard(
    trigger: string,
    { query }: Pick<SuggestionOptions, 'query'> = {},
  ) {
    await this.openSuggestions(trigger, query);
    await this.page.keyboard.press('Enter');
    await expect(this.suggestionMenu).not.toBeVisible();
  }
}

/** The composer in edit mode, with Save and Cancel in place of Post. */
export class MessageEditor {
  readonly page: Page;
  readonly el: Locator;
  readonly composer: MessageComposer;
  readonly saveBtn: Locator;
  readonly cancelBtn: Locator;

  constructor(page: Page, parent: Locator) {
    const el = parent.locator('.message-editor');
    this.composer = new MessageComposer(page, el);
    this.saveBtn = el.getByRole('button', { name: 'Save', exact: true });
    this.cancelBtn = el.getByRole('button', { name: 'Cancel', exact: true });
    this.page = page;
    this.el = el;
  }

  async save(text: string) {
    await expect(this.el).toBeVisible();
    await this.composer.write(text);
    await this.saveBtn.click();
    await expect(this.el).not.toBeVisible();
  }
}
