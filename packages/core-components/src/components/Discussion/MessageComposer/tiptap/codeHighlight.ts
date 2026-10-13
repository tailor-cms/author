// Display `code` blocks while typing, the way the posted message will.
import type { Node } from '@tiptap/pm/model';

import { parseMarkup, type MarkupSegment } from '@tailor-cms/utils';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { Extension } from '@tiptap/vue-3';
import { Plugin } from '@tiptap/pm/state';

interface PlainText {
  text: string;
  // Editor position of each character in `text`, see `toPlainText`
  positions: (number | null)[];
}

// Styles for code highlighting in the composer
const CLASS_NAME = {
  code: 'composer-code',
  codeblock: 'composer-code composer-code--block',
};

/**
 * The editor content as plain text, for the code parser, plus where each
 * character sits in the editor, so found code is highlighted in place.
 *
 * The two do not line up: in the editor, every paragraph also takes a
 * position where it opens and one where it closes, and every chip takes
 * one. Two paragraphs, `ab` and `c`, become:
 *
 *   text      a   b   \n   c
 *   editor    1   2   -    5
 *
 * The line break is not in the editor, so its position is null.
 * It still needs an entry, so the nth position stays the nth character.
 */
const toPlainText = (doc: Node): PlainText => {
  let text = '';
  const positions: (number | null)[] = [];
  doc.descendants((node, pos) => {
    if (node.isText) {
      const value = node.text ?? '';
      text += value;
      for (let i = 0; i < value.length; i += 1) positions.push(pos + i);
    } else if (node.type.name === 'hardBreak' || (node.isBlock && pos > 0)) {
      // Shift+Enter, or a paragraph after the first: a new line, which
      // has no character of its own in the editor
      text += '\n';
      positions.push(null);
    }
    // A chip adds no text; the positions just skip past it
  });
  // For `ab` and `c` above: { text: 'ab\nc', positions: [1, 2, null, 5] }
  return { text, positions };
};

const highlightCode = (
  positions: (number | null)[],
  { kind, start, end }: MarkupSegment,
): Decoration[] => {
  const highlights: Decoration[] = [];
  const attrs = { class: CLASS_NAME[kind as keyof typeof CLASS_NAME] };
  // Editor positions of the current highlight's first and last character
  let first: number | null = null;
  let last = 0;
  const endHighlight = () => {
    if (first === null) return;
    highlights.push(Decoration.inline(first, last + 1, attrs));
    first = null;
  };
  for (const pos of positions.slice(start, end)) {
    if (pos === null) continue;
    // Not after the previous character;
    // a line break or a chip in between
    if (pos !== last + 1) endHighlight();
    first ??= pos;
    last = pos;
  }
  endHighlight();
  return highlights;
};

// Highlights every piece of code in the message
const highlightAllCode = (doc: Node): DecorationSet => {
  const { text, positions } = toPlainText(doc);
  const highlights = parseMarkup(text)
    .filter((it) => it.kind !== 'text')
    .flatMap((code) => highlightCode(positions, code));
  return DecorationSet.create(doc, highlights);
};

export const CodeHighlight = Extension.create({
  name: 'codeHighlight',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: { decorations: ({ doc }) => highlightAllCode(doc) },
      }),
    ];
  },
});
