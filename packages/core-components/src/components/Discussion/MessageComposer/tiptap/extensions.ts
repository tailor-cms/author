// What the composer's editor supports: plain text, `@` mentions,
// `#` references, `:` emoji and code highlighting
import type { ReferenceType } from '@tailor-cms/utils';
import type { SuggestionFetcher } from '../../keys';

import {
  createSuggestion,
  type SuggestionConfig,
  type SuggestionHooks,
} from '../SuggestionMenu/createSuggestion';
import { mentionNode, referenceNode, withSpace } from './document';
import Suggestion, { type SuggestionOptions } from '@tiptap/suggestion';
import { CodeHighlight } from './codeHighlight';
import { Extension } from '@tiptap/vue-3';
import { Placeholder } from '@tiptap/extensions';
import Mention from '@tiptap/extension-mention';
import StarterKit from '@tiptap/starter-kit';

// `#` chip: like a mention
// plus what it points to (activity, element or asset)
const Reference = Mention.extend({
  name: 'reference',
  addAttributes: () => ({
    id: { default: null },
    label: { default: null },
    entityType: { default: null },
  }),
});

// `:` autocomplete; a picked emoji goes in as plain text
const EmojiSuggestion = Extension.create<{
  suggestion: Omit<SuggestionOptions, 'editor'>;
}>({
  name: 'emojiSuggestion',
  addOptions: () => ({ suggestion: {} }),
  addProseMirrorPlugins() {
    return [Suggestion({ editor: this.editor, ...this.options.suggestion })];
  },
});

interface Options {
  placeholder: () => string;
  suggestUsers: SuggestionFetcher;
  suggestReferences: SuggestionFetcher;
  suggestEmoji: SuggestionFetcher;
  // Lets the composer know when an autocomplete menu is open
  hooks: SuggestionHooks;
}

export const createExtensions = ({
  placeholder,
  suggestUsers,
  suggestReferences,
  suggestEmoji,
  hooks,
}: Options) => {
  const suggestion = (config: SuggestionConfig) =>
    createSuggestion(config, hooks);
  return [
    // Basic typing and paragraphs. Formatting is off: messages are saved
    // as plain text, so bold, lists and the rest would be lost on send
    StarterKit.configure({
      heading: false,
      horizontalRule: false,
      bulletList: false,
      orderedList: false,
      listItem: false,
      blockquote: false,
      bold: false,
      italic: false,
      strike: false,
      underline: false,
      code: false,
      codeBlock: false,
      link: false,
    }),
    // Grey text shown while the composer is empty
    Placeholder.configure({ placeholder }),
    // `@` picks a member and adds them as a chip
    Mention.configure({
      HTMLAttributes: { class: 'composer-chip composer-chip--mention' },
      suggestion: suggestion({
        char: '@',
        items: suggestUsers,
        toContent: ({ value, label }) => withSpace(mentionNode(value, label)),
      }),
    }),
    // `#` picks an activity, element or asset and adds it as a chip
    Reference.configure({
      HTMLAttributes: { class: 'composer-chip composer-chip--reference' },
      suggestion: suggestion({
        char: '#',
        items: suggestReferences,
        toContent: ({ value, label, entityType }) =>
          withSpace(
            referenceNode(entityType as ReferenceType, value, label),
          ),
      }),
    }),
    // `:` picks an emoji and adds it as text
    EmojiSuggestion.configure({
      suggestion: suggestion({
        char: ':',
        items: suggestEmoji,
        toContent: ({ value }) => `${value} `,
      }),
    }),
    // Shows text in backticks as code while typing
    CodeHighlight,
  ];
};
