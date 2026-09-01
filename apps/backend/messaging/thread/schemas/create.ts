import { ShortText } from '#shared/request/schemas.ts';
import { oneLine } from 'common-tags';
import { z } from 'zod';

export const CreateThreadInput = z
  .object({
    title: ShortText(1, 120).describe(oneLine`
      Subject of the thread. Required for a repository-level thread.
    `),
    content: z.string().trim().min(1).max(2000).describe('Opening message.'),
  })
  .describe('Opens a new repository-level thread with its first message.');

export type CreateThreadInput = z.infer<typeof CreateThreadInput>;
