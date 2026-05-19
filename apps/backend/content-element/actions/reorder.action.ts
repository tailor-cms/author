import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../content-element.schema.ts';
import * as service from '../content-element.service.ts';

// POST /repositories/:repositoryId/content-elements/:elementId/reorder
// Recalculates the element's position from the supplied target index
// among reorder-eligible siblings
export default defineAction({
  body: schemas.ReorderInput,
  openapi: {
    summary: 'Reorder a content element',
    authenticated: true,
  },
  async handler({ body, req }) {
    return service.reorder(req.contentElement!, body.position);
  },
});
