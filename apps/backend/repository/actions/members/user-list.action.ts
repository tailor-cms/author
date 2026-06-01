import { z } from 'zod';

import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';
import * as schemas from '../../schemas/index.ts';
import * as service from '../../repository.service.ts';

// GET /repositories/:repositoryId/users
// Returns active-access users of the repository
export default defineAction({
  params: schemas.RepositoryItemParams,
  openapi: {
    authenticated: true,
    summary: 'List users with access to the repository',
    responses: {
      200: {
        description: 'Active-access repository members with their role.',
        schema: dataEnvelope(z.array(schemas.RepositoryMember)),
      },
    },
  },
  async handler({ req }) {
    return service.listUsers(req.repository!);
  },
});
