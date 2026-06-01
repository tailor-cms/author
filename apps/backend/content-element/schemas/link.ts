import { oneLine } from 'common-tags';
import { z } from 'zod';

import { Int } from '#shared/request/schemas.ts';
import { ContentElement } from './entity.ts';

export const LinkInput = z
  .object({
    sourceId: Int().describe(oneLine`
      Source element id (may belong to a different repository). The
      caller's read access is verified by \`hasLinkSourceAccess\`
      middleware before this fires.
    `),
    activityId: ContentElement.shape.activityId,
    position: ContentElement.shape.position,
  })
  .describe(oneLine`
    Link payload; creates a linked copy of the source element under the
    target container. Linked copies auto-sync from source until they are
    edited or explicitly unlinked.
  `);

export type LinkInput = z.infer<typeof LinkInput>;
