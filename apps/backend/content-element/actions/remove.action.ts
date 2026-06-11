import { defineAction } from '#shared/request/action.ts';

import * as schemas from '../schemas/index.ts';
import * as service from '../content-element.service.ts';

// DELETE /repositories/:repositoryId/content-elements/:elementId
// Soft-deletes the element.
export default defineAction({
  name: 'delete',
  params: schemas.ContentElementItemParams,
  openapi: {
    authenticated: true,
    summary: 'Soft-delete a content element',
    description: 'Soft-deletes the element; the row stays for provenance.',
    responses: {
      204: { description: 'Element soft-deleted.' },
      403: { description: 'Element belongs to a different repository.' },
      404: { description: 'Content element not found.' },
    },
  },
  async handler({ user, req }) {
    await service.remove(req.repository!, user, req.contentElement!);
  },
});
