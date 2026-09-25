// Custom emoji rules
const NAME = '[a-z0-9][a-z0-9_+\\-]{1,29}';
const SHORTCODE = `:(${NAME}):`;

export const EMOJI_NAME = new RegExp(`^${NAME}$`);

export const EMOJI_NAME_RULE = `A shortcode is 2-30 characters of \
  lowercase letters, digits, "_", "+" or "-".`;

// Finds every emoji inside text, custom or standard:
// `great :party: work 🎉` -> `:party:`, `🎉`
// Each match holds the matched text at [0] (`:party:` or `🎉`) and the
// name inside the colons at [1] (`party`; empty for a standard emoji)
const EMOJI_IN_TEXT = new RegExp(`${SHORTCODE}|\\p{RGI_Emoji}`, 'gv');
// Matches only when the whole value is one custom shortcode:
// `:party:` -> `party`; `🎉` or `hi :party:` -> no match
const TEXT_IS_SHORTCODE = new RegExp(`^${SHORTCODE}$`);

// One segment returned by `splitEmoji`: plain words, a standard emoji,
// or a custom `:shortcode:`
export interface SplitEmojiSegment {
  kind: 'text' | 'emoji' | 'shortcode';
  text: string;
  // Shortcode name
  name?: string;
}

/**
 * Breaks message text into text and emoji segments.
 */
export const splitEmoji = (source: string): SplitEmojiSegment[] => {
  const segments: SplitEmojiSegment[] = [];
  // Skips empty text, e.g. between two emoji
  const pushText = (text: string) => {
    if (text) segments.push({ kind: 'text', text });
  };
  // Where the previous emoji ended
  let last = 0;
  const matches = source.matchAll(EMOJI_IN_TEXT);
  // Unpacks each match: [0] -> `text` (`:party:` or `🎉`), [1] -> `name`
  // (`party`, unset for a standard emoji), `index` -> `emojiStartIndex`
  for (const { 0: text, 1: name, index: emojiStartIndex } of matches) {
    // Plain text between the previous emoji and this one
    pushText(source.slice(last, emojiStartIndex));
    segments.push(
      name ? { kind: 'shortcode', text, name } : { kind: 'emoji', text },
    );
    last = emojiStartIndex + text.length;
  }
  // Plain text after the last emoji
  pushText(source.slice(last));
  return segments;
};

/** `party` -> `:party:`, the form messages and reactions store. */
export const toEmojiShortcode = (name: string) => `:${name}:`;

/** The name inside `:party:`, or null for anything else. */
export const parseEmojiShortcode = (value: string): string | null =>
  TEXT_IS_SHORTCODE.exec(value)?.[1] ?? null;
