import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../repository.schema.ts';
import * as service from '../repository.service.ts';

// POST /repositories
// Creates a repository seeded with schema-default meta and label color;
// optionally sharing it with the supplied user groups.
export default defineAction({
  body: schemas.CreateBody,
  openapi: {
    summary: 'Create a repository',
    authenticated: true,
  },
  async handler({ body, user }) {
    return service.create(body, user);
  },
});
