import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../repository.service.ts';

// PATCH /repositories/:repositoryId
// Updates mutable fields. The service picks name/description/data and
// drops anything else the body carries.
export default defineAction({
  params: schemas.RepositoryItemParams,
  body: schemas.PatchInput,
  openapi: {
    summary: 'Patch a repository',
    authenticated: true,
    responses: {
      200: {
        description: 'Updated repository.',
        schema: dataEnvelope(schemas.Repository),
      },
    },
  },
  async handler({ body, user, req }) {
    return service.update(req.repository!, body, user);
  },
});
