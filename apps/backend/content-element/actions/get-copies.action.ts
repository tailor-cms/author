import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';

import * as schemas from '../schemas/index.ts';
import * as service from '../content-element.service.ts';

// GET /repositories/:repositoryId/content-elements/:elementId/copies
// Returns active linked copies of this source element across repositories,
// decorated with outline-activity pointers for deep-linking. The wire
// shape is `{ usages: ElementCopyLocation[] }`.
export default defineAction({
  params: schemas.ContentElementItemParams,
  openapi: {
    authenticated: true,
    summary: 'List active linked copies of a source content element',
    description: 'Returns linked copies of this element across repositories.',
    responses: {
      200: {
        description: 'Linked copies of the source element.',
        schema: dataEnvelope(schemas.CopiesResult),
      },
      403: { description: 'Element belongs to a different repository.' },
      404: { description: 'Content element not found.' },
    },
  },
  async handler({ req }) {
    const usages = await service.getCopies(req.contentElement!);
    return { usages };
  },
});
