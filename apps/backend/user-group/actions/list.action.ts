import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../user-group.service.ts';

export default defineAction({
  query: schemas.ListFilter,
  openapi: {
    authenticated: true,
    summary: 'List user groups visible to the current user',
    responses: {
      200: {
        description: 'Paginated user group list.',
        schema: dataEnvelope(schemas.ListResult),
      },
    },
  },
  async handler({ query, user, req }) {
    return service.list(user, req.opts!, query);
  },
});
