import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../comment.schema.ts';
import * as service from '../comment.service.ts';

// POST /repositories/:repositoryId/comments
// Creates a new comment authored by the current user.
export default defineAction({
  body: schemas.CreateBody,
  openapi: {
    summary: 'Create a comment',
    authenticated: true,
  },
  async handler({ body, user, req }) {
    return service.create(req.repository!, user, body);
  },
});
