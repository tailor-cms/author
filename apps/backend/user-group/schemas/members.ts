// Wire shapes for the user-group member endpoints.
import { z } from 'zod';
import { Email } from '#shared/request/schemas.ts';
import { UserGroupMember } from './entity.ts';

export const UpsertMembersInput = z
  .object({
    emails: z
      .array(Email())
      .min(1)
      .max(50)
      .describe('Emails to invite/assign. Each lower-cased + trimmed.'),
    role: UserGroupMember.shape.role,
    skipInvite: z
      .boolean()
      .optional()
      .describe('Suppress invitation mails on member creation.'),
  })
  .describe('Bulk-upsert members of a user group.');

export type UpsertMembersInput = z.infer<typeof UpsertMembersInput>;
