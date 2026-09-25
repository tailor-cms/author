import { EMOJI_NAME, EMOJI_NAME_RULE } from '@tailor-cms/utils';
import { oneLine } from 'common-tags';
import { z } from 'zod';

import { Int, IntParam, Timestamp } from '#shared/request/schemas.ts';
import { UserSummary } from '#app/user/schemas/entity.ts';

// Path param shape for every `/:emojiId` route.
export const EmojiParams = z.object({
  emojiId: IntParam().describe('Numeric emoji id (path param).'),
});

export type EmojiParams = z.infer<typeof EmojiParams>;

export const EmojiName = z
  .string()
  .regex(EMOJI_NAME, EMOJI_NAME_RULE)
  .describe(oneLine`
    The shortcode without its colons - \`party\` is written
    \`:party:\`. ${EMOJI_NAME_RULE}
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
    createdAt: Timestamp('When the emoji was added.'),
    createdBy: UserSummary.pick({ id: true, label: true, imgUrl: true })
      .nullable()
      .describe('Who added it.'),
  })
  .meta({ id: 'Emoji' })
  .describe('An emoji available to everybody in the workspace.');

export type Emoji = z.infer<typeof Emoji>;
