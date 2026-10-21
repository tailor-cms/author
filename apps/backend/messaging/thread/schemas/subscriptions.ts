import { ShortText } from '#shared/request/schemas.ts';
import { oneLine } from 'common-tags';
import { z } from 'zod';

export const SetSubscriptionsInput = z
  .object({
    topics: z.array(ShortText(1, 120)).describe(oneLine`
      Sources this thread receives. Replaces the current set; an empty
      array unsubscribes from everything.
    `),
  })
  .describe(oneLine`
    Replaces a repository-level thread's subscriptions. A anchored thread
    cannot subscribe.
  `);

export type SetSubscriptionsInput = z.infer<typeof SetSubscriptionsInput>;
