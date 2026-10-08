export type Parse<T> = (source: string, offset: number) => T[];

/**
 * Finds things in message text: mentions, links, code. Each regex match
 * becomes a value through `parseMatch`, and the text between matches
 * goes through `parseGap`. Returning null from `parseMatch` leaves that
 * match in the text, so a typo never swallows content. For example,
 *
 *   splitBy(/<@(\d+)>/g, toMention, toText)('hi <@12>, <@x>')
 *
 * gives [text 'hi ', mention 12, text ', <@x>']. The parsers nest:
 * markup finds code blocks and parses the gaps for inline code, which
 * parses its gaps as text. `offset` is where `source` sits in the
 * whole message, so positions reported by nested parsers stay right.
 */
export const splitBy =
  <T>(
    pattern: RegExp,
    parseMatch: (match: RegExpExecArray, start: number) => T | null,
    parseGap: Parse<T>,
  ) =>
    (source: string, offset = 0): T[] => {
      const values: T[] = [];
      let cursor = 0;
      for (const match of source.matchAll(pattern)) {
        const value = parseMatch(match, offset + match.index);
        if (value === null) continue;
        const gap = source.slice(cursor, match.index);
        values.push(...parseGap(gap, offset + cursor), value);
        cursor = match.index + match[0].length;
      }
      values.push(...parseGap(source.slice(cursor), offset + cursor));
      return values;
    };
