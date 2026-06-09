import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';

import * as schemas from '../schemas/index.ts';
import * as service from '../content-element.service.ts';

// PATCH /repositories/:repositoryId/content-elements/:elementId
// Updates mutable fields. Passing `deletedAt: null` restores a previously
// soft-deleted element.
export default defineAction({
  name: 'update',
  params: schemas.ContentElementItemParams,
  body: schemas.PatchInput,
  openapi: {
    authenticated: true,
    summary: 'Patch a content element',
    description: 'Updates mutable fields; `deletedAt: null` restores the row.',
    responses: {
      200: {
        description: 'Updated content element.',
        schema: dataEnvelope(schemas.ContentElement),
      },
      403: { description: 'Element belongs to a different repository.' },
      404: { description: 'Content element not found.' },
    },
  },
  async handler({ body, user, req }) {
    return service.update(req.repository!, user, req.contentElement!, body);
  },
});
