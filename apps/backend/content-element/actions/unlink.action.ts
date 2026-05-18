import { defineAction } from '#shared/request/action.ts';
import * as service from '../content-element.service.ts';

// POST /repositories/:repositoryId/content-elements/:elementId/unlink
// Converts a linked copy into a local copy. `sourceId` is preserved so
// the provenance trail survives.
export default defineAction({
  openapi: {
    summary: 'Unlink a content element from its source',
    authenticated: true,
  },
  async handler({ user, req }) {
    return service.unlink(req.repository!, user, req.contentElement!);
  },
});
