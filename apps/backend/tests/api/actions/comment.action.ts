import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../schemas/index.ts';
import service from '../seed.service.ts';

// POST /seed/comment
// Creates a comment against an existing activity / element pair, authored
// by the default seed user unless `authorEmail` names another existing user.
export default defineAction({
  name: 'seedComment',
  body: schemas.CommentInput,
  openapi: {
    summary: 'Seed a comment',
    description:
      'Creates a comment authored by the default seed user, or by ' +
      '`authorEmail` when provided.',
    authenticated: true,
  },
  async handler({ body }) {
    return service.createComment(body);
  },
});
