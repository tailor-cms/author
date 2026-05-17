import { defineAction } from '#shared/request/action.ts';
import * as service from '../comment.service.ts';

// DELETE /repositories/:repositoryId/comments/:commentId
// Soft-deletes the comment.
export default defineAction({
  openapi: {
    summary: 'Delete a comment',
    authenticated: true,
  },
  async handler({ req }) {
    return service.remove(req.comment!);
  },
});
