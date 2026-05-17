import publishingService from '#shared/publishing/publishing.service.js';
import { defineAction } from '#shared/request/action.ts';

// POST /repositories/:repositoryId/publish
// Publishes the repository's catalog entry. publishingService is a JS
// module so its return type is `any` - the response shape is owned by the
// publishing layer's manifest contract, not this slice.
export default defineAction({
  openapi: {
    summary: 'Publish repository details',
    authenticated: true,
  },
  async handler({ req }) {
    // Wrapper wraps the manifest in `{ data }` and sends 200.
    return publishingService.publishRepoDetails(req.repository!);
  },
});
