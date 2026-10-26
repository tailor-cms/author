import { IntParam } from '#shared/request/schemas.ts';
import { oneLine } from 'common-tags';
import { z } from 'zod';

export const MessageFilter = z
  .object({
    before: IntParam().optional().describe(oneLine`
      Load messages older than this one; what scrolling up a thread or
      its replies asks for.
    `),
    after: IntParam().optional().describe(oneLine`
      Load messages newer than this one; what scrolling down from an
      older stretch of a thread or its replies asks for.
    `),
    around: IntParam().optional().describe(oneLine`
      Load a page around this message, half of it before; what opening
      a thread or its replies at an older message asks for.
    `),
    limit: IntParam().optional().describe('Pagination limit.'),
  })
  .describe(oneLine`
    Reads a thread or a reply chain a page at a time, from the newest
    or from a message within it.
  `);

export type MessageFilter = z.infer<typeof MessageFilter>;
