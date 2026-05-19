// Wire-shape contracts for the Activity slice.
// Single source of truth: actions register these on `defineAction`, the
// service types its parameters via `z.infer`.
import { z } from 'zod';

import { IntParam, QueryBoolean } from '#shared/request/schemas.ts';

// GET /repositories/:repositoryId/activities
export const ListFilter = z.object({
  // Include detached items (unreachable in the outline). Default: false.
  detached: QueryBoolean.optional(),
  // Restrict to outline-level activities (those declared in the schema's
  // outline structure). Adds the "published-but-not-yet-deleted" carve-out
  // so the FE can show pending-unpublish entries.
  outlineOnly: QueryBoolean.optional(),
  // Pagination + sort (consumed by processQuery middleware).
  offset: IntParam().optional(),
  limit: IntParam().optional(),
  sortBy: z.string().max(64).optional(),
  sortOrder: z.enum(['ASC', 'DESC', 'asc', 'desc']).optional(),
  paranoid: QueryBoolean.optional(),
});

export type ListFilter = z.infer<typeof ListFilter>;

// POST /repositories/:repositoryId/activities
export const CreateInput = z.object({
  // Client-generated uid (model defaults to UUIDv4 when omitted).
  uid: z.uuid().optional(),
  // Parent activity (`null` for outline roots).
  parentId: z.number().int().positive().nullable().optional(),
  // Schema-declared activity type id, e.g. `MODULE` / `PAGE`.
  type: z.string().trim().min(1).max(255),
  // Position among siblings.
  position: z.number().min(0),
  // Activity-level metadata bag (JSONB); shape is owned by the schema's
  // outline-level config and is merged with `defaultMeta` server-side.
  data: z.record(z.string(), z.unknown()).optional(),
  // Refs bag (JSONB); configurable relationships to other activities.
  refs: z.record(z.string(), z.unknown()).optional(),
});

export type CreateInput = z.infer<typeof CreateInput>;

// PATCH /repositories/:repositoryId/activities/:activityId
export const PatchInput = z.object({
  // New position among siblings (use /reorder for index-based moves).
  position: z.number().min(0).optional(),
  // Replacement data bag (JSONB); shape is owned by the schema's
  // outline-level config. Editing `data` on a linked copy auto-unlinks
  // via the model's `autoUnlinkOnEdit` afterUpdate hook.
  data: z.record(z.string(), z.unknown()).optional(),
  // Replacement refs bag.
  refs: z.record(z.string(), z.unknown()).optional(),
  // New parent activity. `null` re-roots the activity. Reparenting an
  // outline activity bumps the old parent's `modifiedAt`.
  parentId: z.number().int().positive().nullable().optional(),
});

export type PatchInput = z.infer<typeof PatchInput>;

// POST /repositories/:repositoryId/activities/:activityId/reorder
export const ReorderInput = z.object({
  // Zero-based target index in the sibling list. Float, because the
  // client may pass a normalized fractional position (the model recomputes
  // anyway via `calculatePosition`).
  position: z.number().min(0),
});

export type ReorderInput = z.infer<typeof ReorderInput>;

// POST /repositories/:repositoryId/activities/:activityId/clone
export const CloneInput = z.object({
  // Target repository for the clone. Verified for access by middleware.
  repositoryId: z.number().int().positive(),
  // Target parent activity (`null` clones to the outline root).
  parentId: z.number().int().positive().nullable().optional(),
  // Target position. When omitted, the model leaves the source position.
  position: z.number().min(0).optional(),
});

export type CloneInput = z.infer<typeof CloneInput>;

// POST /repositories/:repositoryId/activities/:activityId/status
export const WorkflowStatusInput = z.object({
  // Assignee user id (`null` clears assignment).
  assigneeId: z.number().int().positive().nullable().optional(),
  // Workflow status id (schema-defined).
  status: z.string().trim().min(1).optional(),
  // Workflow priority id (schema-defined).
  priority: z.string().trim().min(1).optional(),
  // Free-text note attached to the status entry.
  description: z.string().nullable().optional(),
  // Due-date ISO8601 string. `null` clears.
  dueDate: z.union([z.iso.datetime({ offset: true }), z.null()]).optional(),
});

export type WorkflowStatusInput = z.infer<typeof WorkflowStatusInput>;

// POST /repositories/:repositoryId/activities/link
export const LinkInput = z.object({
  // Source activity id (in a potentially different repository).
  sourceId: z.number().int().positive(),
  // Target parent activity (`null` links at the outline root).
  parentId: z.number().int().positive().nullable().optional(),
  // Position among siblings in the target.
  position: z.number().min(0),
});

export type LinkInput = z.infer<typeof LinkInput>;
