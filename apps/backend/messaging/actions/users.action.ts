import {
  RepositoryScopedParams,
  dataEnvelope,
} from '#shared/request/schemas.ts';
import { UserSummary } from '#app/user/schemas/entity.ts';
import { defineAction } from '#shared/request/action.ts';
import { listUsersWithAccess } from '../mention.service.ts';
import { z } from 'zod';

export default defineAction({
  name: 'getUsersWithAccess',
  params: RepositoryScopedParams,
  openapi: {
    authenticated: true,
    summary: 'List users with access to the repository',
    description:
      'Members, their user groups and system admins; whom @ can mention.',
    responses: {
      200: {
        description: 'Users with access to the repository.',
        schema: dataEnvelope(z.array(UserSummary)),
      },
    },
  },
  handler({ req }) {
    return listUsersWithAccess(req.repository!.id);
  },
});
