// Wire shape for the comment resolve toggle.
import { oneLine } from 'common-tags';
import { z } from 'zod';

import { IntParam } from '#shared/request/schemas.ts';

export const ResolveInput = z.object({
  id: IntParam().optional().describe('Single-comment selector.'),
  contentElementId: IntParam().optional().describe(oneLine`
    Bulk selector; every comment attached to the given element is
    toggled together.
  `),
  resolvedAt: z.union([z.number(), z.iso.datetime(), z.null()]).optional()
    .describe(oneLine`
      Current resolution state echoed back to flip:
      truthy -> unresolve (set resolvedAt to null),
      absent / null -> resolve (stamp resolvedAt = now).
    `),
}).describe(oneLine`
  Toggle the resolved state of a single comment (by \`id\`) or every
  comment attached to a content element (by \`contentElementId\`).
  Exactly one selector is required.
`);

export type ResolveInput = z.infer<typeof ResolveInput>;
