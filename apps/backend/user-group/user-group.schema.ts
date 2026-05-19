// Wire-shape contracts for the UserGroup slice.
// Single source of truth: actions register these on `defineAction`, the
// service types its parameters via `z.infer`.
import { z } from 'zod';
import { UserRole } from '@tailor-cms/interfaces/role';

import { Email, IntParam, ShortText } from '#shared/request/schemas.ts';

// GET /user-group
export const ListQuery = z.object({
  // Substring match against group name (iLike).
  filter: z.string().trim().max(100).optional(),
  // Pagination + sort (consumed by processQuery middleware).
  offset: IntParam().optional(),
  limit: IntParam().optional(),
  sortBy: z.string().max(64).optional(),
  sortOrder: z.enum(['ASC', 'DESC', 'asc', 'desc']).optional(),
});

export type ListQuery = z.infer<typeof ListQuery>;

// POST /user-group
export const CreateBody = z.object({
  // Display name (2..250 chars to match the column-level validator).
  name: ShortText(2, 250),
  // Logo. Accepts a URL or a base64 data URL; ceiling mirrors the
  // user `imgUrl` cap (the fe Avatar component sends compressed JPEGs).
  logoUrl: z.string().trim().max(200_000).optional(),
});

export type CreateBody = z.infer<typeof CreateBody>;

// PATCH /user-group/:id
export const PatchBody = z.object({
  // New display name (2..250 chars).
  name: ShortText(2, 250).optional(),
  // New logo URL; data URL (see create for ceiling rationale).
  logoUrl: z.string().trim().max(200_000).optional(),
});

export type PatchBody = z.infer<typeof PatchBody>;

// POST /user-group/:id/users
export const UpsertMembersBody = z.object({
  // Emails to invite/assign. Each lower-cased + trimmed at the boundary.
  emails: z.array(Email()).min(1).max(50),
  // Group-scoped role.
  role: z.enum([UserRole.ADMIN, UserRole.COLLABORATOR, UserRole.USER]),
  // Suppress invitation mails on create.
  skipInvite: z.boolean().optional(),
});

export type UpsertMembersBody = z.infer<typeof UpsertMembersBody>;

// DELETE /user-group/:id/users/:userId
export const RemoveMemberParams = z.object({
  userId: IntParam(),
});

export type RemoveMemberParams = z.infer<typeof RemoveMemberParams>;
