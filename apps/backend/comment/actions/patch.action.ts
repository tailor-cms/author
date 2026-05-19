import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../comment.schema.ts';
import * as service from '../comment.service.ts';

// PATCH /repositories/:repositoryId/comments/:commentId
// Replaces the body of an existing comment. `canEdit` mw upstream
// guarantees the actor is the comment's author. The model stamps
// `editedAt` via the service so the FE can render an "(edited)" hint.
export default defineAction({
  body: schemas.PatchBody,
  openapi: {
    summary: 'Edit a comment',
    authenticated: true,
  },
  async handler({ body, req }) {
    return service.update(req.comment!, body.content);
  },
});
