import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';

import * as schemas from '../schemas/index.ts';
import * as service from '../content-element.service.ts';

// GET /repositories/:repositoryId/content-elements/:elementId/source
export default defineAction({
  params: schemas.ContentElementItemParams,
  openapi: {
    authenticated: true,
    summary: 'Get source info for a linked content element',
    description: 'Returns the source element pointer for a linked copy.',
    responses: {
      200: {
        description: 'Source info, or null when not a linked copy.',
        schema: dataEnvelope(schemas.ElementSourceInfo.nullable()),
      },
      403: { description: 'Element belongs to a different repository.' },
      404: { description: 'Content element not found.' },
    },
  },
  async handler({ req }) {
    return service.getSourceInfo(req.contentElement!);
  },
});
