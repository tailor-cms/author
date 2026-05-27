import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';

import * as schemas from '../schemas/index.ts';
import * as service from '../comment.service.ts';

// DELETE /repositories/:repositoryId/comments/:commentId
// Soft-deletes the comment. Only the author may delete (gated by the
// `canEdit` route middleware).
export default defineAction({
  params: schemas.CommentItemParams,
  openapi: {
    authenticated: true,
    summary: 'Soft-delete a comment',
    description: 'Soft-deletes the comment; the row stays for provenance.',
    responses: {
      200: {
        description: 'Id of the soft-deleted comment.',
        schema: dataEnvelope(schemas.RemoveResult),
      },
      403: { description: 'Caller is not the comment author.' },
      404: { description: 'Comment not found.' },
    },
  },
  async handler({ req }) {
    return service.remove(req.comment!);
  },
});
