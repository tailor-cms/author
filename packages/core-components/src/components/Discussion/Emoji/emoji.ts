// Standard emoji for the picker and the `:` autocomplete, from the
// `@tiptap/extension-emoji` list.
import {
  emojis,
  emojiToShortcode,
  shortcodeToEmoji,
} from '@tiptap/extension-emoji';
import { toEmojiShortcode } from '@tailor-cms/utils';

export interface EmojiEntry {
  // What gets inserted and stored
  char: string;
  name: string;
  // The main shortcode, shown as `:name:`
  shortcode: string;
  shortcodes: string[];
  tags: string[];
  group: string;
}

export interface EmojiGroup {
  label: string;
  entries: EmojiEntry[];
}

// A symbol that is text unless followed by U+FE0F, e.g. ☺ or ❤
const TEXT_BY_DEFAULT =
  /(?!\p{Emoji_Presentation}|\p{Emoji_Modifier})\p{Emoji}(?!\uFE0F)/gu;

// Adds U+FE0F where the list leaves it out, so ☺ is drawn as an emoji
const asEmoji = (char: string) => char.replace(TEXT_BY_DEFAULT, '$&\uFE0F');

// Leaves out image-only entries, which have no character, and regional
// indicator letters, which only mean something in pairs (a 26 Unicode
// letters 🇦 to 🇿. They exist to build country flags)
const ENTRIES: EmojiEntry[] = emojis
  .filter((it) => !!it.emoji && !it.name.startsWith('regional_indicator_'))
  .map((it) => ({
    char: asEmoji(it.emoji!),
    name: it.name,
    shortcode: it.shortcodes[0] ?? it.name,
    shortcodes: it.shortcodes,
    tags: it.tags,
    // Faces and hearts come without a group; being the most used, they
    // lead the picker
    group: it.group || 'smileys',
  }));

const GROUP_LABELS: Record<string, string> = {
  'smileys': 'Smileys',
  'people & body': 'People',
  'animals & nature': 'Nature',
  'food & drink': 'Food',
  'travel & places': 'Travel',
  'activities': 'Activities',
  'objects': 'Objects',
  'symbols': 'Symbols',
  'flags': 'Flags',
};

export const EMOJI_GROUPS: EmojiGroup[] = Object.entries(GROUP_LABELS)
  .map(([group, label]) => ({
    label,
    entries: ENTRIES.filter((it) => it.group === group),
  }))
  .filter((it) => it.entries.length);

export const emojiChar = (shortcode: string) => {
  const char = shortcodeToEmoji(shortcode, emojis)?.emoji;
  return char && asEmoji(char);
};

// The `:name:` of a standard emoji character, when it has one:
// 👍 gives `:+1:`, a custom `:party_parrot:` has none
export const emojiShortcode = (char: string) => {
  const shortcode = emojiToShortcode(char, emojis);
  return shortcode ? toEmojiShortcode(shortcode) : undefined;
};

/**
 * Scores an emoji entry against a search term.
 */
const scoreOf = ({ name, shortcodes, tags }: EmojiEntry, term: string) => {
  if (shortcodes.includes(term)) return 100;
  if (shortcodes.some((it) => it.startsWith(term))) return 60;
  if (name.startsWith(term)) return 50;
  if (shortcodes.some((it) => it.includes(term))) return 30;
  if (tags.some((it) => it.startsWith(term))) return 20;
  return 0;
};

export const searchEmoji = (query: string, limit = 12): EmojiEntry[] => {
  const term = query.trim().toLowerCase();
  if (!term) return ENTRIES.slice(0, limit);
  return ENTRIES.map((entry) => ({ entry, score: scoreOf(entry, term) }))
    .filter((it) => it.score)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((it) => it.entry);
};
