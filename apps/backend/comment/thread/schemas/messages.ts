import { IntParam } from '#shared/request/schemas.ts';
import { oneLine } from 'common-tags';
import { z } from 'zod';

export const MessageFilter = z
  .object({
    before: IntParam().optional().describe(oneLine`
      Load messages older than this one; what scrolling up the thread
      asks for.
    `),
    limit: IntParam().optional().describe('Pagination limit.'),
  })
  .describe('Reads a thread a page at a time, working back from the newest.');

export type MessageFilter = z.infer<typeof MessageFilter>;
