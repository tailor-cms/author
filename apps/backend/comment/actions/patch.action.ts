import { z } from 'zod';
import { defineAction } from '#shared/request/action.ts';
import * as service from '../comment.service.ts';

// PATCH /repositories/:repositoryId/comments/:commentId
// Replaces the body of an existing comment. `canEdit` mw upstream
// guarantees the actor is the comment's author. The model stamps
// `editedAt` via the service so the FE can render an "(edited)" hint.
const Body = z.object({
  // Replacement body; same length bounds as create.
  content: z.string().min(1).max(2000),
});
export type PatchBody = z.infer<typeof Body>;

export default defineAction({
  body: Body,
  openapi: {
    summary: 'Edit a comment',
    authenticated: true,
  },
  async handler({ body, req }) {
    return service.update(req.comment!, body.content);
  },
});
