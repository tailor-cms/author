import publishingService from '#shared/publishing/publishing.service.js';
import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../schemas/index.ts';

// POST /repositories/:repositoryId/publish
// Publishes the repository's catalog entry.
export default defineAction({
  params: schemas.RepositoryItemParams,
  openapi: {
    authenticated: true,
    summary: 'Publish repository details',
  },
  async handler({ req }) {
    return publishingService.publishRepoDetails(req.repository!);
  },
});
