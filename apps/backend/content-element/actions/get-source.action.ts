import { defineAction } from '#shared/request/action.ts';
import * as service from '../content-element.service.ts';

// GET /repositories/:repositoryId/content-elements/:elementId/source
// Returns the source element's display info for a linked copy, or null
// when the element is not a copy / the source has been hard-deleted.
export default defineAction({
  openapi: {
    summary: 'Get source info for a linked copy',
    authenticated: true,
  },
  async handler({ req }) {
    return service.getSourceInfo(req.contentElement!);
  },
});
