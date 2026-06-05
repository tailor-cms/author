// Wire shape for the admin invite-or-update endpoint.
import { z } from 'zod';

import { Int } from '#shared/request/schemas.ts';
import { User } from './entity.ts';

export const UpsertInput = z
  .object({
    email: User.shape.email,
    firstName: User.shape.firstName.unwrap().optional(),
    lastName: User.shape.lastName.unwrap().optional(),
    role: User.shape.role.optional(),
    userGroupIds: z.array(Int()).optional().describe(`
      Replace the user's user-group memberships with this exact set.
      Omit to leave memberships untouched.
    `),
    skipInvite: z.boolean().optional().describe(`
      Suppress the invitation mail on create. No effect on update.
    `),
  })
  .describe('Admin-driven invite-or-update payload.');

export type UpsertInput = z.infer<typeof UpsertInput>;
