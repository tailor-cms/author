// Shows emoji the way the posted message will: as `:shortcode:`s in
// code, as emoji everywhere else. Runs after every change.
import type { Node as DocNode, Schema } from '@tiptap/pm/model';
import type { EditorState } from '@tiptap/pm/state';

import { customEmojiNode, type EmojiResolver } from './document';
import { emojiChar, emojiShortcode } from '../../Emoji/emoji';
import { type PlainText, toPlainText } from './codeHighlight';
import { Extension } from '@tiptap/vue-3';
import { parseMarkup, toEmojiShortcode } from '@tailor-cms/utils';
import { Plugin } from '@tiptap/pm/state';

// `:name:`, or a standard emoji character
const EMOJI = /:([\w+\-]+):|\p{RGI_Emoji}/gv;

interface Swap {
  from: number;
  to: number;
  node: DocNode;
}

// Typed text, not a custom emoji's own `:shortcode:`, see `toPlainText`
const isTyped = (
  positions: PlainText['positions'],
  start: number,
  length: number,
) =>
  positions
    .slice(start, start + length)
    .every((pos, i) => pos === positions[start]! + i);

// A custom emoji wins over a standard one of the same name, as in posts
const toEmoji = (
  schema: Schema,
  shortcode: string,
  name: string,
  resolve: EmojiResolver,
) => {
  const custom = resolve(shortcode);
  if (custom) return schema.nodeFromJSON(customEmojiNode(custom));
  const char = emojiChar(name);
  return char ? schema.text(char) : undefined;
};

const findSwaps = (
  doc: DocNode,
  schema: Schema,
  resolve: EmojiResolver,
): Swap[] => {
  const { text, positions } = toPlainText(doc);
  const code = parseMarkup(text).filter((it) => it.kind !== 'text');
  const isInCode = (offset: number) =>
    code.some(({ start, end }) => offset >= start && offset < end);
  const swaps: Swap[] = [];
  // Custom emoji images in code become their shortcode
  doc.descendants((node, pos) => {
    if (node.type.name !== 'customEmoji') return;
    if (!isInCode(positions.indexOf(pos))) return;
    const shortcode = schema.text(toEmojiShortcode(node.attrs.name));
    swaps.push({ from: pos, to: pos + 1, node: shortcode });
  });
  // Standard emoji in code become shortcodes, shortcodes elsewhere emoji
  for (const { 0: match, 1: name, index } of text.matchAll(EMOJI)) {
    if (!isTyped(positions, index, match.length)) continue;
    const isCode = isInCode(index);
    let node: DocNode | undefined;
    if (name && !isCode) node = toEmoji(schema, match, name, resolve);
    if (!name && isCode) {
      const shortcode = emojiShortcode(match);
      node = shortcode ? schema.text(shortcode) : undefined;
    }
    if (!node) continue;
    const from = positions[index]!;
    swaps.push({ from, to: from + match.length, node });
  }
  return swaps;
};

const swapEmoji = (state: EditorState, resolve: EmojiResolver) => {
  const swaps = findSwaps(state.doc, state.schema, resolve);
  if (!swaps.length) return null;
  const { tr } = state;
  // From the end, so earlier positions stay valid
  swaps
    .sort((a, b) => b.from - a.from)
    .forEach(({ from, to, node }) => tr.replaceWith(from, to, node));
  return tr;
};

export const EmojiSync = Extension.create<{ resolve: EmojiResolver }>({
  name: 'emojiSync',
  addOptions: () => ({ resolve: () => undefined }),
  addProseMirrorPlugins() {
    return [
      new Plugin({
        appendTransaction: (transactions, _prev, state) => {
          if (!transactions.some((it) => it.docChanged)) return null;
          return swapEmoji(state, this.options.resolve);
        },
      }),
    ];
  },
});
