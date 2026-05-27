import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';

import * as schemas from '../schemas/index.ts';
import * as service from '../comment.service.ts';

// PATCH /repositories/:repositoryId/comments/:commentId
// Replaces the comment body. The `canEdit` route middleware ensures
// only the author reaches this handler; the service stamps `editedAt`
// so the FE can render an "(edited)" hint.
export default defineAction({
  params: schemas.CommentItemParams,
  body: schemas.PatchInput,
  openapi: {
    authenticated: true,
    summary: 'Edit a comment',
    description: 'Replaces the body of an existing comment.',
    responses: {
      200: {
        description: 'Updated comment row.',
        schema: dataEnvelope(schemas.Comment),
      },
      403: { description: 'Caller is not the comment author.' },
      404: { description: 'Comment not found.' },
    },
  },
  async handler({ body, req }) {
    return service.update(req.comment!, body.content);
  },
});
