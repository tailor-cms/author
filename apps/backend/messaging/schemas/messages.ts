import { IntParam } from '#shared/request/schemas.ts';
import { oneLine } from 'common-tags';
import { z } from 'zod';

export const MessageFilter = z
  .object({
    before: IntParam().optional().describe(oneLine`
      Load messages older than this one; what scrolling up a thread or
      its replies asks for.
    `),
    limit: IntParam().optional().describe('Pagination limit.'),
  })
  .describe(oneLine`
    Reads a thread or a reply chain a page at a time, working back from
    the newest.
  `);

export type MessageFilter = z.infer<typeof MessageFilter>;
