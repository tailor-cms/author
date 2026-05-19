import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../repository.schema.ts';
import * as service from '../repository.service.ts';

// PATCH /repositories/:repositoryId
// Updates mutable fields. The service picks name/description/data and
// drops anything else the body carries.
export default defineAction({
  body: schemas.PatchBody,
  openapi: {
    summary: 'Patch a repository',
    authenticated: true,
  },
  async handler({ body, user, req }) {
    return service.update(req.repository!, body, user);
  },
});
