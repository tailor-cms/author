// Wire shape for the seed-user endpoint.
import { z } from 'zod';
import { Email } from '#shared/request/schemas.ts';

export const UserGroupSpec = z
  .object({
    name: z
      .string()
      .optional()
      .describe('Group name; defaults to "Test Group".'),
    role: z.string().optional().describe('Member role; defaults to ADMIN.'),
  })
  .describe('Optional user group to create alongside the seeded entity.');

export type UserGroupSpec = z.infer<typeof UserGroupSpec>;

export const UserInput = z
  .object({
    email: Email().optional().describe('Email; faker-generated when absent.'),
    password: z
      .string()
      .optional()
      .describe('Password; faker-generated when absent.'),
    role: z.string().optional().describe('System role; defaults to ADMIN.'),
    userGroup: UserGroupSpec.optional(),
  })
  .describe('Optional fields for seeding a test user.');

export type UserInput = z.infer<typeof UserInput>;
