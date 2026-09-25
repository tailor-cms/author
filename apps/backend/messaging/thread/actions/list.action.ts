import { RepositoryScopedParams } from '#shared/request/schemas.ts';
import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../thread.service.ts';

export default defineAction({
  name: 'getThreads',
  params: RepositoryScopedParams,
  query: schemas.ThreadFilter,
  raw: true,
  openapi: {
    authenticated: true,
    summary: 'List threads',
    description: 'Threads ordered by most recent activity.',
    responses: {
      200: {
        description: 'Page of threads.',
        schema: schemas.ThreadListResult,
      },
    },
  },
  handler({ query, user, req }) {
    return service.listThreads(req.repository!.id, user.id, query);
  },
});
