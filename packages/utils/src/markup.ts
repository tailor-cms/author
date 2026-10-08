/**
 * Backtick code in message text: `inline` or ```block```.
 *
 * Messages are saved as plain text, so editor formatting is lost on
 * send; backticks survive and are styled when shown. Each segment
 * carries its position in the text so the composer can style it too.
 */

import { type Parse, splitBy } from './splitBy';

// ```block```, which can span lines. A word right after the opening
// marks is the language (```js), when the code starts on the next line.
const FENCE = /```(?:([a-z0-9+#.-]{1,16})\n)?([\s\S]*?)```/gi;

// `inline`, on one line. A backtick never closed is shown as typed.
const CODE = /`([^`\n]+)`/g;

export interface MarkupSegment {
  kind: 'text' | 'code' | 'codeblock';
  // Content without the backticks
  text: string;
  language?: string;
  // Position in the text, backticks included
  start: number;
  end: number;
}

const parseText: Parse<MarkupSegment> = (text, start) =>
  text ? [{ kind: 'text', text, start, end: start + text.length }] : [];

const parseInline = splitBy<MarkupSegment>(
  CODE,
  ([raw, code], start) => {
    if (!code.trim()) return null;
    return { kind: 'code', text: code, start, end: start + raw.length };
  },
  parseText,
);

const trimFence = (value: string) => value.replace(/^\n|\n$/g, '');

const parseBlocks = splitBy<MarkupSegment>(
  FENCE,
  ([raw, language, code], start) => ({
    kind: 'codeblock',
    text: trimFence(code),
    language: language || undefined,
    start,
    end: start + raw.length,
  }),
  parseInline,
);

// Blocks are taken first, so ``` is never read as inline code
export const parseMarkup = (source: string): MarkupSegment[] =>
  parseBlocks(source);
