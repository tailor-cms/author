// Response shape for the comment soft-delete endpoint.
import { z } from 'zod';

import { Int } from '#shared/request/schemas.ts';

export const RemoveResult = z
  .object({
    id: Int().describe('Id of the soft-deleted comment.'),
  })
  .meta({ id: 'CommentRemoveResult' })
  .describe('Acknowledgement of a comment soft-delete.');

export type RemoveResult = z.infer<typeof RemoveResult>;
