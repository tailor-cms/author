import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';

import * as schemas from '../schemas/index.ts';
import * as service from '../content-element.service.ts';

// POST /repositories/:repositoryId/content-elements/:elementId/reorder
// Recalculates the element's position from the supplied target index
// among reorder-eligible siblings
export default defineAction({
  name: 'reorder',
  params: schemas.ContentElementItemParams,
  body: schemas.ReorderInput,
  openapi: {
    authenticated: true,
    summary: 'Reorder a content element',
    description: 'Recomputes the element position from the target index.',
    responses: {
      200: {
        description: 'Reordered content element.',
        schema: dataEnvelope(schemas.ContentElement),
      },
      403: { description: 'Element belongs to a different repository.' },
      404: { description: 'Content element not found.' },
    },
  },
  async handler({ body, req }) {
    return service.reorder(req.contentElement!, body.position);
  },
});
