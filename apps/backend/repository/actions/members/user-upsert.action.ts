import { z } from 'zod';
import { RepositoryRole } from '@tailor-cms/interfaces';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import { Email } from '#shared/request/schemas.ts';
import * as service from '../../repository.service.ts';

// POST /repositories/:repositoryId/users
// Invites a new user or updates an existing user's repository role.
const Body = z.object({
  // Invitee email; lower-cased + trimmed.
  email: Email(),
  // Repository-scoped role
  role: z.enum(RepositoryRole),
});
export type UpsertUserBody = z.infer<typeof Body>;

async function handler({ body, req }: Ctx<{ body: typeof Body }>) {
  const user = await service.upsertUser(req.repository!, body.email, body.role);
  return { user };
}

export default defineAction({
  body: Body,
  openapi: {
    summary: 'Invite or update a repository user',
    authenticated: true,
  },
  handler,
});
