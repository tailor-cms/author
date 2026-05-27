// Wire shape for the cross-repository activity link endpoint.
import { oneLine } from 'common-tags';
import { z } from 'zod';

import { Int } from '#shared/request/schemas.ts';

import { Activity } from './entity.ts';

export const LinkInput = z.object({
  sourceId: Int().describe(oneLine`
    Source activity id (may belong to a different repository). The
    caller's read access is verified by \`hasLinkSourceAccess\`
    middleware before this fires.
  `),
  parentId: Activity.shape.parentId
    .optional()
    .describe('Target parent activity id; null links at the outline root.'),
  position: Activity.shape.position,
}).describe(oneLine`
    Link payload; creates a linked-copy tree of the source under the
    target. Linked copies auto-sync from source until they are edited
    or explicitly unlinked.
  `);

export type LinkInput = z.infer<typeof LinkInput>;
