import { defineAction } from '#shared/request/action.ts';
import * as service from '../repository.service.ts';

// GET /repositories/:repositoryId
// Loads the repository detail view: last revision, the current user's
// RepositoryUser row, attached user groups, and tags.
export default defineAction({
  openapi: {
    summary: 'Get a repository by id',
    authenticated: true,
  },
  async handler({ user, req }) {
    return service.loadDetail(req.repository!, user);
  },
});
