import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../content-element.schema.ts';
import * as service from '../content-element.service.ts';

// PATCH /repositories/:repositoryId/content-elements/:elementId
// Updates mutable fields. Passing `deletedAt: null` restores a previously
// soft-deleted element.
export default defineAction({
  body: schemas.PatchInput,
  openapi: {
    summary: 'Patch a content element',
    authenticated: true,
  },
  async handler({ body, user, req }) {
    return service.update(req.repository!, user, req.contentElement!, body);
  },
});
