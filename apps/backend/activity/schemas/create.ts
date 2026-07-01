// Wire shape for creating an activity under a repository.
import { z } from 'zod';

import { Activity } from './entity.ts';

export const CreateInput = z
  .object({
    uid: Activity.shape.uid.optional(),
    parentId: Activity.shape.parentId.optional(),
    type: Activity.shape.type,
    position: Activity.shape.position.optional(),
    data: Activity.shape.data.optional(),
    refs: Activity.shape.refs.optional(),
  })
  .describe('Create activity payload.');

export type CreateInput = z.infer<typeof CreateInput>;
