import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';

import * as schemas from '../schemas/index.ts';

// GET /repositories/:repositoryId/content-elements/:elementId
// The `getContentElement` param middleware loads the entry, enforces
// repository scoping, and returns 404/403 otherwise. This handler is a
// thin pass-through.
export default defineAction({
  params: schemas.ContentElementItemParams,
  openapi: {
    authenticated: true,
    summary: 'Get a single content element by id',
    description: 'Returns the content element identified by the path id.',
    responses: {
      200: {
        description: 'The content element.',
        schema: dataEnvelope(schemas.ContentElement),
      },
      403: { description: 'Element belongs to a different repository.' },
      404: { description: 'Content element not found.' },
    },
  },
  async handler({ req }) {
    return req.contentElement!;
  },
});
