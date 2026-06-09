import { oneLine } from 'common-tags';
import publishingService from '#shared/publishing/publishing.service.js';
import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../schemas/index.ts';

// POST /repositories/:repositoryId/publish
// Publishes the repository's catalog entry.
export default defineAction({
  name: 'publish',
  params: schemas.RepositoryItemParams,
  openapi: {
    authenticated: true,
    summary: 'Publish repository details',
    description: oneLine`
      Republishes the catalog manifest for the repository so consumers
      see the latest details (name, description, tags).
    `,
  },
  async handler({ req }) {
    return publishingService.publishRepoDetails(req.repository!);
  },
});
