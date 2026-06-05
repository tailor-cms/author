import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../user.service.ts';

export default defineAction({
  query: schemas.ListFilter,
  openapi: {
    authenticated: true,
    summary: 'List users',
    responses: {
      200: {
        description: 'Paginated user list.',
        schema: dataEnvelope(schemas.ListResult),
      },
    },
  },
  async handler({ query, req }) {
    return service.list(req.options!, query);
  },
});
