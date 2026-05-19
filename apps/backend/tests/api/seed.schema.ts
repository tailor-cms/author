// Wire-shape contracts for the test-seed slice.
// Test-only endpoints gated by `ENABLE_TEST_API_ENDPOINTS`; the schemas
// only enforce minimal shape because seed callers expect generous
// defaults
import { z } from 'zod';

import { Email, IntParam } from '#shared/request/schemas.ts';

// Optional user-group spec used by `user` and `catalog` seeders. Both
// fields default server-side when absent.
export const UserGroupSpec = z.object({
  name: z.string().optional().describe('Group name; defaults to "Test Group".'),
  role: z.string().optional().describe('Member role; defaults to ADMIN.'),
}).describe('Optional user group to create alongside the seeded entity.');

export type UserGroupSpec = z.infer<typeof UserGroupSpec>;

// POST /seed/user
export const UserInput = z.object({
  email: Email().optional().describe('Email; faker-generated when absent.'),
  password: z
    .string()
    .optional()
    .describe('Password; faker-generated when absent.'),
  role: z.string().optional().describe('System role; defaults to ADMIN.'),
  userGroup: UserGroupSpec.optional(),
}).describe('Optional fields for seeding a test user.');

export type UserInput = z.infer<typeof UserInput>;

// POST /seed/catalog
export const CatalogInput = z.object({
  userGroup: UserGroupSpec.optional(),
}).describe('Optional user group to share the seeded catalog with.');

export type CatalogInput = z.infer<typeof CatalogInput>;

// POST /seed/comment
export const CommentInput = z.object({
  content: z.string().min(1).max(2000).describe('Comment body.'),
  repositoryId: IntParam().describe('Repository the comment belongs to.'),
  activityId: IntParam().describe('Activity the comment belongs to.'),
  contentElementId: IntParam()
    .nullable()
    .optional()
    .describe('Optional content element scope.'),
}).describe('Required and optional fields for seeding a comment.');

export type CommentInput = z.infer<typeof CommentInput>;

// POST /seed/repository
export const RepositoryInput = z.object({
  name: z
    .string()
    .optional()
    .describe('Repository name; faker-generated when absent.'),
  description: z.string().optional().describe('Repository description.'),
  authorEmail: Email()
    .nullable()
    .optional()
    .describe('Email of an existing user to attribute the import to.'),
  includeLinkExample: z
    .boolean()
    .optional()
    .describe('Also create a linked-content example pointing at the seeded repo.'),
}).describe('Optional fields for seeding a repository from the fixture archive.');

export type RepositoryInput = z.infer<typeof RepositoryInput>;
