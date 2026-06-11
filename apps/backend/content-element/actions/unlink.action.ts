import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';

import * as schemas from '../schemas/index.ts';
import * as service from '../content-element.service.ts';

// POST /repositories/:repositoryId/content-elements/:elementId/unlink
// Converts a linked copy into a local copy. `sourceId` is preserved so
// the provenance trail survives.
export default defineAction({
  name: 'unlink',
  params: schemas.ContentElementItemParams,
  openapi: {
    authenticated: true,
    summary: 'Unlink a content element from its source',
    description: 'Detaches the linked copy so it becomes an independent copy.',
    responses: {
      200: {
        description: 'Unlinked content element.',
        schema: dataEnvelope(schemas.ContentElement),
      },
      403: { description: 'Element belongs to a different repository.' },
      404: { description: 'Content element not found.' },
    },
  },
  async handler({ user, req }) {
    return service.unlink(req.repository!, user, req.contentElement!);
  },
});
