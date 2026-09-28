import { CUSTOM_EMOJI, type CustomEmoji, type CustomEmojiSource } from './keys';
import { inject } from 'vue';
import { parseEmojiShortcode } from '@tailor-cms/utils';

/**
 * The workspace's custom emojis; provided by the host app.
 */
export const useCustomEmoji = () => {
  const source = inject<CustomEmojiSource | null>(CUSTOM_EMOJI, null);

  // `:xyz:` -> the `xyz` emoji; a standard emoji resolves to nothing
  const resolve = (value: string): CustomEmoji | undefined => {
    const name = parseEmojiShortcode(value);
    return name ? source?.get(name) : undefined;
  };

  const search = (query: string, limit?: number): CustomEmoji[] =>
    source?.search(query, limit) ?? [];

  return { resolve, search };
};
