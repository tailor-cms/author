// Wire-shape contracts for the Repository slice.
// Single source of truth: actions register these on `defineAction`, the
// service types its parameters via `z.infer`.
import { z } from 'zod';
import { RepositoryRole } from '@tailor-cms/interfaces';

import {
  Description,
  Email,
  IntArrayFromForm,
  IntParam,
  QueryBoolean,
  ShortText,
  StringArrayFromQuery,
} from '#shared/request/schemas.ts';
import { general } from '#config';
import { RepoData } from './lib/data-attr.ts';

// GET /repositories
export const ListQuery = z.object({
  // Substring match against repository name (iLike, up to 250 chars).
  search: z.string().trim().max(250).optional(),
  // Exact match against repository name.
  name: z.string().trim().max(250).optional(),
  // Restrict to repositories shared with a single user group.
  userGroupId: IntParam().optional(),
  // Pinned filter for the current user's catalog view.
  pinned: QueryBoolean.optional(),
  // Restrict to one or more schema ids. Default is unfiltered, LIST is
  // a visibility view, not a validity gate. The env allowlist
  // (`availableSchemas`) is only enforced at create time.
  schemas: StringArrayFromQuery(),
  // Restrict to repositories tagged with any of these tag ids.
  tagIds: StringArrayFromQuery(),
  // Schema id used to find repos whose schema is link-compatible via the
  // mapsTo cross-schema rules (defined in the schema).
  compatibleWith: z.string().trim().max(64).optional(),
  // Pagination + sort (consumed by processQuery middleware).
  offset: IntParam().optional(),
  limit: IntParam().optional(),
  sortBy: z.string().max(64).optional(),
  sortOrder: z.enum(['ASC', 'DESC', 'asc', 'desc']).optional(),
  paranoid: QueryBoolean.optional(),
});

export type ListQuery = z.infer<typeof ListQuery>;

// POST /repositories
export const CreateBody = z.object({
  // Schema registry id this repo will follow. Must be in the env
  // allowlist (`NUXT_PUBLIC_AVAILABLE_SCHEMAS`); defaults to every
  // bundled schema when the env is unset. Imports bypass this gate;
  // they can carry their own schema config in the archive.
  schema: ShortText(2, 64).refine(
    (id) => general.availableSchemas.includes(id),
    { message: 'Schema is not in the available schemas list' },
  ),
  // Display name (2..250 chars).
  name: ShortText(2, 250),
  // Long description (2..2000 chars).
  description: Description(2, 2000),
  // Schema-defined meta blob. `$$` is the validated system namespace;
  // everything else flows as schema-defined meta (see data-attr.ts).
  data: RepoData.optional(),
  // Optional list of user-group ids to share the new repo with.
  userGroupIds: z.array(z.number().int()).optional(),
});

export type CreateBody = z.infer<typeof CreateBody>;

// PATCH /repositories/:repositoryId
export const PatchBody = z.object({
  // New display name (2..250 chars).
  name: ShortText(2, 250).optional(),
  // New description (2..2000 chars).
  description: Description(2, 2000).optional(),
  // Replacement schema-meta blob (full replacement; FE merges before
  // send). `$$` shape is enforced via RepoData; server-managed
  // fields are stripped in the service before persisting.
  data: RepoData.optional(),
});

export type PatchBody = z.infer<typeof PatchBody>;

// POST /repositories/:repositoryId/pin
export const PinBody = z.object({
  // Whether to pin (true) or unpin (false) the repo for the current user.
  pin: z.boolean(),
});

export type PinBody = z.infer<typeof PinBody>;

// POST /repositories/:repositoryId/clone
export const CloneBody = z.object({
  // Display name for the clone (2..250 chars).
  name: ShortText(2, 250),
  // Description for the clone (2..2000 chars).
  description: Description(2, 2000),
});

export type CloneBody = z.infer<typeof CloneBody>;

// POST /repositories/:repositoryId/users
export const UpsertUserBody = z.object({
  // Invitee email; lower-cased + trimmed.
  email: Email(),
  // Repository-scoped role
  role: z.enum(RepositoryRole),
});

export type UpsertUserBody = z.infer<typeof UpsertUserBody>;

// DELETE /repositories/:repositoryId/users/:userId
export const RemoveUserParams = z.object({
  // Numeric id of the user whose access is being revoked.
  userId: IntParam(),
});

export type RemoveUserParams = z.infer<typeof RemoveUserParams>;

// POST /repositories/:repositoryId/user-group
export const AddUserGroupBody = z.object({
  // Numeric id of the UserGroup to share with.
  userGroupId: z.number().int().positive(),
});

export type AddUserGroupBody = z.infer<typeof AddUserGroupBody>;

// DELETE /repositories/:repositoryId/user-group/:userGroupId
export const RemoveUserGroupParams = z.object({
  userGroupId: IntParam(),
});

export type RemoveUserGroupParams = z.infer<typeof RemoveUserGroupParams>;

// POST /repositories/:repositoryId/tags
export const AddTagBody = z.object({
  // Tag name; created on the fly if missing (1..100 chars).
  name: ShortText(1, 100),
});

export type AddTagBody = z.infer<typeof AddTagBody>;

// DELETE /repositories/:repositoryId/tags/:tagId
export const RemoveTagParams = z.object({
  tagId: IntParam(),
});

export type RemoveTagParams = z.infer<typeof RemoveTagParams>;

// POST /repositories/:repositoryId/references/cleanup
export const ReferenceCleanupBody = z.object({
  // Activities with dangling references to remove.
  activities: z.array(z.record(z.string(), z.unknown())).optional(),
  // Content elements with dangling references to remove.
  elements: z.array(z.record(z.string(), z.unknown())).optional(),
});

export type ReferenceCleanupBody = z.infer<typeof ReferenceCleanupBody>;

// POST /repositories/import
export const ImportBody = z.object({
  // Display name for the imported repo (2..250 chars).
  name: ShortText(2, 250),
  // Description for the imported repo (2..2000 chars).
  description: Description(2, 2000),
  // Optional list of user-group ids to share the imported repo with.
  // FormData serialises arrays via `String(value)` so we accept the
  // wire-form (comma-separated, 'undefined', etc.) and normalise to
  // an array of ints.
  userGroupIds: IntArrayFromForm(),
});

export type ImportBody = z.infer<typeof ImportBody>;

// GET /repositories/:repositoryId/export/:jobId/status
// POST /repositories/:repositoryId/export/:jobId
export const ExportJobParams = z.object({
  jobId: z.string().min(1),
});

export type ExportJobParams = z.infer<typeof ExportJobParams>;
