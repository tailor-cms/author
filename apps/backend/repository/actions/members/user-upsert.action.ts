import { defineAction, type Ctx } from '#shared/request/action.ts';
import * as schemas from '../../repository.schema.ts';
import * as service from '../../repository.service.ts';

// POST /repositories/:repositoryId/users
// Invites a new user or updates an existing user's repository role.
async function handler({
  body,
  req,
}: Ctx<{ body: typeof schemas.UpsertUserInput }>) {
  const user = await service.upsertUser(req.repository!, body.email, body.role);
  return { user };
}

export default defineAction({
  body: schemas.UpsertUserInput,
  openapi: {
    summary: 'Invite or update a repository user',
    authenticated: true,
  },
  handler,
});
