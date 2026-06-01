import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../repository.service.ts';

// GET /repositories
export default defineAction({
  query: schemas.ListFilter,
  raw: true,
  openapi: {
    authenticated: true,
    summary: 'List repositories visible to the current user',
    responses: {
      200: {
        description: 'Paginated repository list.',
        schema: schemas.ListResult,
      },
    },
  },
  async handler({ query, user, req }) {
    return service.list(req.opts!, user, query);
  },
});
