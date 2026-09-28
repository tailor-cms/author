import type { Content, Editor } from '@tiptap/vue-3';
import type { SuggestionOptions, SuggestionProps } from '@tiptap/suggestion';
import type { SuggestionFetcher, SuggestionItem } from '../../types';
import type { Box } from './index.vue';

import { VueRenderer } from '@tiptap/vue-3';
import SuggestionMenu from './index.vue';

export interface SuggestionConfig {
  char: string;
  items: SuggestionFetcher;
  // What a selected item puts into the message
  toContent: (item: SuggestionItem) => Content;
}

export interface SuggestionHooks {
  // While a menu is open, Enter selects instead of sending
  onOpen: (char: string) => void;
  onClose: (char: string) => void;
}

type Options = Omit<SuggestionOptions<SuggestionItem>, 'editor'>;
type RenderProps = SuggestionProps<SuggestionItem, SuggestionItem>;

// The overlay the composer sits in, or the body. Mounted on the body,
// selecting an item would count as a click outside and close the overlay.
const hostOf = (editor: Pick<Editor, 'view'>): HTMLElement =>
  editor.view.dom.closest<HTMLElement>('.v-overlay__content') ??
  document.body;

/**
 * Tiptap finds the typed query; this shows `SuggestionMenu` for it and
 * handles the keys.
 */
export const createSuggestion = (
  { char, items: fetchItems, toContent }: SuggestionConfig,
  hooks: SuggestionHooks,
): Options => ({
  char,
  items: ({ query }) => fetchItems(query),
  command: ({ editor, range, props: item }) =>
    editor.chain().focus().insertContentAt(range, toContent(item)).run(),
  render: () => {
    let renderer: VueRenderer | null = null;
    let host: HTMLElement | null = null;
    let command: RenderProps['command'] = () => {};
    let items: SuggestionItem[] = [];
    let caret: DOMRect | null = null;
    let selectedIndex = 0;

    // Measured each time, since an overlay can move
    const originOf = (): Box | null => {
      if (!host || host === document.body) return null;
      const { left, top, bottom } = host.getBoundingClientRect();
      return { left, top, bottom };
    };

    const menuProps = () => ({
      items,
      caret,
      selectedIndex,
      origin: originOf(),
    });
    const refresh = () => renderer?.updateProps(menuProps());

    // `command` changes with the query, so it is read on click
    const onSelect = (item: SuggestionItem) => command(item);

    // Takes Tiptap's latest state and highlights the first item
    const sync = (props: RenderProps) => {
      command = props.command;
      items = props.items;
      caret = props.clientRect?.() ?? null;
      selectedIndex = 0;
    };

    const selectHighlighted = () => command(items[selectedIndex]!);

    const move = (step: number) => {
      selectedIndex = (selectedIndex + step + items.length) % items.length;
      refresh();
    };

    const keyActions: Record<string, () => void> = {
      ArrowUp: () => move(-1),
      ArrowDown: () => move(1),
      Enter: selectHighlighted,
      Tab: selectHighlighted,
    };

    const close = () => {
      if (!renderer) return;
      renderer.element?.remove();
      renderer.destroy();
      renderer = null;
      host = null;
      hooks.onClose(char);
    };

    return {
      onStart: (props) => {
        sync(props);
        host = hostOf(props.editor);
        renderer = new VueRenderer(SuggestionMenu, {
          editor: props.editor,
          props: { ...menuProps(), onSelect },
        });
        host.appendChild(renderer.element as HTMLElement);
        hooks.onOpen(char);
      },
      onUpdate: (props) => {
        sync(props);
        refresh();
      },
      // Escape is handled by Tiptap, which then calls `onExit`
      onKeyDown: ({ event: { key } }) => {
        const action = keyActions[key];
        if (!items.length || !action) return false;
        action();
        return true;
      },
      onExit: close,
    };
  },
});
