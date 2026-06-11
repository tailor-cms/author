import { defineAction, type Ctx } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';
import * as schemas from '../../schemas/index.ts';
import * as service from '../../repository.service.ts';

// POST /repositories/:repositoryId/users
// Invites a new user or updates an existing user's repository role.
async function handler({
  body,
  req,
}: Ctx<{
  body: typeof schemas.UpsertUserInput;
  params: typeof schemas.RepositoryItemParams;
}>) {
  const user = await service.upsertUser(req.repository!, body.email, body.role);
  return { user };
}

export default defineAction({
  name: 'addUser',
  params: schemas.RepositoryItemParams,
  body: schemas.UpsertUserInput,
  openapi: {
    authenticated: true,
    summary: 'Invite or update a repository user',
    responses: {
      200: {
        description: 'Upserted repository member with their role.',
        schema: dataEnvelope(schemas.UpsertUserResult),
      },
    },
  },
  handler,
});
