// Converts between the editor, where mentions and references are chips,
// and the saved message, plain text with tokens like `<@12|User>`
import type { Editor, JSONContent } from '@tiptap/vue-3';
import {
  type MessageToken,
  type ReferenceType,
  formatMention,
  formatReference,
  parseMessage,
} from '@tailor-cms/utils';

type Id = string | number;

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

// Adds a space after a chip
export const withSpace = (node: JSONContent): JSONContent[] => [
  node,
  { type: 'text', text: ' ' },
];

const toNode = (token: MessageToken): JSONContent => {
  if (token.kind === 'text') return { type: 'text', text: token.text };
  if (token.kind === 'mention') return mentionNode(token.userId, token.label);
  return referenceNode(token.entityType, token.entityId, token.label);
};

// Saved message text -> editor content, tokens shown as chips.
export const toDocument = (content: string): JSONContent => ({
  // Tiptap content is JSON: a `doc` holding a `paragraph`, which holds
  // the pieces of the message. Each token in the text becomes one piece:
  // `hi <@12|Ana>` -> text `hi `, then a mention chip for Ana (id 12)
  type: 'doc',
  content: [{ type: 'paragraph', content: parseMessage(content).map(toNode) }],
});

// Editor content -> saved message text, chips written as tokens.
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
