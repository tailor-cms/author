import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../repository.service.ts';

// POST /repositories
// Creates a repository seeded with schema-default meta;
// optionally sharing it with the supplied user groups.
export default defineAction({
  body: schemas.CreateInput,
  openapi: {
    authenticated: true,
    summary: 'Create a repository',
    responses: {
      200: {
        description: 'Created repository.',
        schema: dataEnvelope(schemas.Repository),
      },
    },
  },
  async handler({ body, user }) {
    return service.create(body, user);
  },
});
