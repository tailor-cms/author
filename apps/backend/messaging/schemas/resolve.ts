import { IntParam } from '#shared/request/schemas.ts';
import { oneLine } from 'common-tags';
import { z } from 'zod';

export const ResolveInput = z
  .object({
    id: IntParam().optional().describe('A single comment.'),
    contentElementId: IntParam().optional().describe(oneLine`
      Every comment on this element, settled together.
    `),
    resolvedAt: z.union([z.number(), z.iso.datetime(), z.null()]).optional()
      .describe(oneLine`
        The state being flipped: send the comment's current
        \`resolvedAt\` to reopen it, send nothing to resolve it.
      `),
  })
  .describe('Specify a comment, or an element to settle all of its comments.');

export type ResolveInput = z.infer<typeof ResolveInput>;
