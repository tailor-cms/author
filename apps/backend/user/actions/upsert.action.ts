import { z } from 'zod';
import { UserRole } from '@tailor-cms/interfaces/role';
import { defineAction } from '#shared/request/action.ts';
import { Email, ShortText } from '#shared/request/schemas.ts';
import * as service from '../user.service.ts';

// POST /users
// Admin-driven invite-or-update. Email is the natural key; matching an
// existing user (paranoid:false) updates them in place, otherwise the
// user is created and emailed an invitation (unless `skipInvite` is set,
// e.g. for SSO accounts that don't need a password setup mail).
const Body = z.object({
  // Account email. Trimmed + lower-cased; doubles as the upsert key.
  email: Email(),
  // Optional first name (2..50 chars to match the DB validator).
  firstName: ShortText(2, 50).optional(),
  // Optional last name.
  lastName: ShortText(2, 50).optional(),
  // System-level role.
  // `defaultValue: COLLABORATOR`.
  role: z.enum(UserRole).optional(),
  // Replace the user's user-group memberships with this exact set.
  // Omit to leave memberships untouched.
  userGroupIds: z.array(z.number().int()).optional(),
  // Suppress the invitation email on create. No effect on update.
  skipInvite: z.boolean().optional(),
});
export type UpsertBody = z.infer<typeof Body>;

export default defineAction({
  body: Body,
  openapi: {
    summary: 'Invite or update a user (admin)',
    authenticated: true,
  },
  async handler({ body }) {
    return service.upsert(body);
  },
});
