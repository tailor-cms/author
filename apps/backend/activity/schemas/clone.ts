// Wire shape for the activity deep-clone endpoint.
import { oneLine } from 'common-tags';
import { z } from 'zod';

import { Int } from '#shared/request/schemas.ts';

import { Activity } from './entity.ts';

export const CloneInput = z.object({
  repositoryId: Int().describe(oneLine`
      Target repository id. The caller's write access is verified by
      \`hasCloneTargetAccess\` middleware before this fires.
    `),
  parentId: Activity.shape.parentId
    .optional()
    .describe('Target parent activity id; null clones to the outline root.'),
  position: Activity.shape.position
    .optional()
    .describe(`Target position. Omit to keep the source activity's position.`),
}).describe(oneLine`
    Deep-copies the activity (with descendants and
    content elements) into the target location.
  `);

export type CloneInput = z.infer<typeof CloneInput>;
