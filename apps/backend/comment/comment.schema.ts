// Wire-shape contracts for the Comment slice.
// Single source of truth: actions register these on `defineAction`, the
// service types its parameters via `z.infer`.
import { z } from 'zod';

import { IntParam } from '#shared/request/schemas.ts';

// GET /repositories/:repositoryId/comments
export const ListQuery = z.object({
  // Restrict to comments on a single activity.
  activityId: IntParam().optional(),
  // Restrict to comments on a single content element. Both filters may
  // be combined; the client never sends both, but the wire shape supports it.
  contentElementId: IntParam().optional(),
});

export type ListQuery = z.infer<typeof ListQuery>;

// POST /repositories/:repositoryId/comments
export const CreateBody = z.object({
  // Client-generated uid. Optional; the
  // model defaults to UUIDv4 when absent.
  uid: z.uuid().optional(),
  // Activity this comment belongs to; required for element-scoped
  // comments so the activity-thread view sees them.
  activityId: IntParam(),
  // Optional element scope; absent for activity-level discussion.
  contentElementId: IntParam().optional(),
  // Comment body. Length floor mirrors the model's `len: [1, 2000]`
  // validator so we reject obvious garbage at the wire boundary.
  content: z.string().min(1).max(2000),
});

export type CreateBody = z.infer<typeof CreateBody>;

// PATCH /repositories/:repositoryId/comments/:commentId
export const PatchBody = z.object({
  // Replacement body; same length bounds as create.
  content: z.string().min(1).max(2000),
});

export type PatchBody = z.infer<typeof PatchBody>;

// POST /repositories/:repositoryId/comments/resolve
export const ResolveBody = z.object({
  // Single-comment selector.
  id: IntParam().optional(),
  // Bulk selector: every comment on the given element.
  contentElementId: IntParam().optional(),
  // Current `resolvedAt` (echoed back to flip): truthy -> unresolve,
  // absent/null -> resolve.
  resolvedAt: z.union([z.number(), z.iso.datetime(), z.null()]).optional(),
});

export type ResolveBody = z.infer<typeof ResolveBody>;
