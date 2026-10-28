// Converts between the editor, where mentions and references are chips,
// and the saved message, plain text with tokens like `<@12|User>`
import type { Editor, JSONContent } from '@tiptap/vue-3';
import type { CustomEmoji } from '../../types';
import type { ReferenceType } from '@tailor-cms/interfaces/comment';
import {
  type MessageToken,
  formatMention,
  formatReference,
  parseMarkup,
  parseMessage,
  splitEmoji,
} from '@tailor-cms/utils';

type Id = string | number;

// `:party:` -> the workspace's `party` emoji, if there is one
export type EmojiResolver = (value: string) => CustomEmoji | undefined;

export const mentionNode = (id: Id, label: string): JSONContent => ({
  type: 'mention',
  attrs: { id, label },
});

export const referenceNode = (
  entityType: ReferenceType,
  id: Id,
  label: string,
): JSONContent => ({
  type: 'reference',
  attrs: { entityType, id, label },
});

export const customEmojiNode = ({ name, url }: CustomEmoji): JSONContent => ({
  type: 'customEmoji',
  attrs: { name, url },
});

const textNode = (text: string): JSONContent => ({ type: 'text', text });

// Text with its custom `:shortcode:`s as images, except in code
const withCustomEmoji = (
  text: string,
  resolve: EmojiResolver,
): JSONContent[] =>
  parseMarkup(text).flatMap(({ kind, start, end }) => {
    const value = text.slice(start, end);
    if (kind !== 'text') return [textNode(value)];
    return splitEmoji(value).map((segment) => {
      const emoji = segment.kind === 'shortcode' && resolve(segment.text);
      return emoji ? customEmojiNode(emoji) : textNode(segment.text);
    });
  });

// Adds a space after a chip
export const withSpace = (node: JSONContent): JSONContent[] => [
  node,
  textNode(' '),
];

const toNodes = (
  token: MessageToken,
  resolve: EmojiResolver,
): JSONContent[] => {
  if (token.kind === 'text') return withCustomEmoji(token.text, resolve);
  if (token.kind === 'mention')
    return [mentionNode(token.userId, token.label)];
  return [referenceNode(token.entityType, token.entityId, token.label)];
};

// Saved message text -> editor content, tokens shown as chips and
// custom emoji as images.
export const toDocument = (
  content: string,
  resolve: EmojiResolver,
): JSONContent => ({
  // Tiptap content is JSON: a `doc` holding a `paragraph`, which holds
  // the pieces of the message. Each token in the text becomes one piece:
  // `hi <@12|Ana>` -> text `hi `, then a mention chip for Ana (id 12)
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: parseMessage(content).flatMap((it) => toNodes(it, resolve)),
    },
  ],
});

// Editor content -> saved message text, chips written as tokens.
// Custom emoji write their `:shortcode:` through their own `renderText`
export const serialize = (editor: Pick<Editor, 'getText'>): string =>
  editor
    .getText({
      blockSeparator: '\n',
      textSerializers: {
        mention: ({ node: { attrs } }) =>
          formatMention(Number(attrs.id), attrs.label ?? ''),
        reference: ({ node: { attrs } }) =>
          formatReference(attrs.entityType, attrs.id, attrs.label ?? ''),
      },
    })
    .trim();
