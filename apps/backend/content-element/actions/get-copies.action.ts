import { defineAction } from '#shared/request/action.ts';
import * as service from '../content-element.service.ts';

// GET /repositories/:repositoryId/content-elements/:elementId/copies
// Returns active linked copies of this source element across repositories,
// decorated with outline-activity pointers for deep-linking. The wire
// shape is `{ usages: CopyLocation[] }`
export default defineAction({
  openapi: {
    summary: 'List active linked copies of a source element',
    authenticated: true,
  },
  async handler({ req }) {
    const usages = await service.getCopies(req.contentElement!);
    return { usages };
  },
});
