import type { CustomEmoji } from '../types';

import { parseEmojiShortcode } from '@tailor-cms/utils';
import { useDiscussionContext } from '../context';

/**
 * The workspace's custom emojis; provided by the host app.
 */
export const useCustomEmoji = () => {
  const { customEmoji: source } = useDiscussionContext();

  // `:xyz:` -> the `xyz` emoji; a standard emoji resolves to nothing
  const resolve = (value: string): CustomEmoji | undefined => {
    const name = parseEmojiShortcode(value);
    return name ? source?.get(name) : undefined;
  };

  const search = (query: string, limit?: number): CustomEmoji[] =>
    source?.search(query, limit) ?? [];

  return { resolve, search };
};
