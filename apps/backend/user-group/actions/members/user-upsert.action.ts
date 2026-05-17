import { z } from 'zod';
import { UserRole } from '@tailor-cms/interfaces/role';
import { defineAction } from '#shared/request/action.ts';
import { Email } from '#shared/request/schemas.ts';
import * as service from '../../user-group.service.ts';

// POST /user-group/:id/users
// Invites missing users by email and assigns each on the group (or
// updates an existing member's role). Capped at 50 invites per call so
// a single request cannot trigger a thundering herd of invitation mails.
const Body = z.object({
  // Emails to invite/assign. Each lower-cased + trimmed at the boundary.
  emails: z.array(Email()).min(1).max(50),
  // Group-scoped role.
  role: z.enum([UserRole.ADMIN, UserRole.COLLABORATOR, UserRole.USER]),
  // Suppress invitation mails on create.
  skipInvite: z.boolean().optional(),
});
export type UpsertMembersBody = z.infer<typeof Body>;

export default defineAction({
  body: Body,
  openapi: {
    summary: 'Invite or update members of a user group',
    authenticated: true,
    responses: { 204: { description: 'No content' } },
  },
  async handler({ body, req }) {
    await service.upsertMembers(req.userGroup!, body);
  },
});
