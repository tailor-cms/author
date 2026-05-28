// Response shape for the activity soft-delete endpoint.
import { z } from 'zod';

import { Int } from '#shared/request/schemas.ts';

export const RemoveResult = z
  .object({
    id: Int().describe('Id of the soft-deleted activity.'),
  })
  .meta({ id: 'ActivityRemoveResult' })
  .describe('Acknowledgement of an activity soft-delete.');

export type RemoveResult = z.infer<typeof RemoveResult>;
