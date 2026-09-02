import { EMOJI_NAME } from '@tailor-cms/interfaces/emoji';
import { oneLine } from 'common-tags';
import { z } from 'zod';

import { Int, IntParam } from '#shared/request/schemas.ts';

// Path param shape for every `/:emojiId` route.
export const EmojiParams = z.object({
  emojiId: IntParam().describe('Numeric emoji id (path param).'),
});

export type EmojiParams = z.infer<typeof EmojiParams>;

export const EMOJI_NAME_RULE = oneLine`
  A shortcode is 2-30 characters of lowercase letters, digits, "_", "+"
  or "-".
`;

export const EmojiName = z
  .string()
  .regex(EMOJI_NAME, EMOJI_NAME_RULE).describe(oneLine`
  The shortcode without its colons - \`party\` is written \`:party:\`.
  Lowercase, URL-safe and 2-30 characters, so it can be typed, searched
  and put in a path; a single character would turn times and ratios
  ("3:4:5") into emoji.
`);

export const Emoji = z
  .object({
    id: Int(),
    name: EmojiName,
    url: z.string().describe(oneLine`
      Content-addressed and served with a far-future cache, so a client
      fetches it once and keeps it. Replacing an emoji mints a new URL
      rather than asking anybody to revalidate the old one.
    `),
    isAnimated: z.boolean(),
  })
  .meta({ id: 'Emoji' })
  .describe('An emoji available to everybody in the workspace.');

export type Emoji = z.infer<typeof Emoji>;
