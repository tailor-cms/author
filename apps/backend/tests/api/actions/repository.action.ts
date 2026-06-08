import { oneLine } from 'common-tags';
import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../schemas/index.ts';
import service from '../seed.service.ts';

// POST /seed/repository
// Imports the `pizza.tgz` fixture archive and returns the resulting
// repository, the canonical seeded activity, the canonical content
// element, and (optionally) a linked-content example.
export default defineAction({
  body: schemas.RepositoryInput,
  openapi: {
    summary: 'Seed a repository',
    description: oneLine`
      Imports the pizza.tgz fixture archive and returns the seeded
      repository plus the canonical activity and content element.
      Optionally also creates a linked-content example pointing at it.
    `,
    authenticated: true,
  },
  async handler({ body }) {
    return service.importRepositoryArchive(body);
  },
});
