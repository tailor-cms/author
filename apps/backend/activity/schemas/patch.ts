// Wire shape for the activity PATCH endpoint.
import { oneLine } from 'common-tags';
import { z } from 'zod';

import { Activity } from './entity.ts';

export const PatchInput = z
  .object({
    parentId: Activity.shape.parentId.optional().describe(oneLine`
      New parent activity id; null re-roots the activity. Reparenting
      an outline activity bumps the old parent's \`modifiedAt\`.
    `),
    position: Activity.shape.position.optional(),
    data: Activity.shape.data.optional().describe(oneLine`
      Replacement data bag (JSONB). Editing \`data\` on a linked copy
      auto-unlinks via the model's \`autoUnlinkOnEdit\` afterUpdate
      hook.
    `),
    refs: Activity.shape.refs.optional().describe('Replacement refs bag.'),
  })
  .describe('Patch payload for an activity update operation.');

export type PatchInput = z.infer<typeof PatchInput>;
