// Wire shapes for the user-group member endpoints.
import { z } from 'zod';
import { Email, Int } from '#shared/request/schemas.ts';
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

export const UpsertMembersResult = z
  .object({
    total: Int().describe('Total emails processed in the request.'),
    created: Int().describe('Members newly added to the group.'),
    updated: Int().describe('Existing members whose role changed.'),
    skipped: Int().describe('Emails already members with an unchanged role.'),
    failed: z
      .array(Email())
      .describe('Emails that could not be invited or assigned.'),
  })
  .meta({ id: 'UpsertMembersResult' })
  .describe('Per-request summary of a bulk member upsert.');

export type UpsertMembersResult = z.infer<typeof UpsertMembersResult>;
