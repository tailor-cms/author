import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../seed.schema.ts';
import service from '../seed.service.ts';

// POST /seed/comment
// Creates a comment authored by the default seed user against an
// existing activity / element pair.
export default defineAction({
  body: schemas.CommentInput,
  openapi: {
    summary: 'Seed a comment',
    description:
      'Creates a comment authored by the default seed user.',
    authenticated: true,
  },
  async handler({ body }) {
    return service.createComment(body);
  },
});
