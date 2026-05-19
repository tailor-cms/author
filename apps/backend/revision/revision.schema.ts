// Wire-shape contracts for the Revision slice.
// Single source of truth: actions register these on `defineAction`, the
// service types its parameters via `z.infer`.
import { z } from 'zod';
import { Entity } from '@tailor-cms/interfaces/revision';

import { IntParam } from '#shared/request/schemas.ts';

// GET /repositories/:repositoryId/revisions
// Two call shapes from the client:
//   - bulk list (revisions page) - no filters
//   - per-entity audit trail (EntityRevisions) - `entity` + `entityId`
export const ListFilter = z
  .object({
    // Restrict to one entity kind. When set, `entityId` is
    // required so the result is scoped.
    entity: z.enum(Entity).optional(),
    // The entity id; matched against the JSONB `state.id` field.
    entityId: IntParam().optional(),
    // Pagination & sort
    offset: IntParam().optional(),
    limit: IntParam().optional(),
    sortBy: z.string().max(64).optional(),
    sortOrder: z.enum(['ASC', 'DESC', 'asc', 'desc']).optional(),
  })
  .refine((q) => !q.entity || q.entityId !== undefined, {
    message: '`entityId` is required when `entity` is set',
    path: ['entityId'],
  });

export type ListFilter = z.infer<typeof ListFilter>;

// GET /repositories/:repositoryId/revisions/:revisionId
export const GetParams = z.object({
  revisionId: IntParam(),
});

export type GetParams = z.infer<typeof GetParams>;

// GET /repositories/:repositoryId/revisions/time-travel
export const TimeTravelInput = z.object({
  // Target activity (the root of the subtree we'll reconstruct).
  activityId: IntParam(),
  // Strict ISO 8601 with a literal `T` separator. Matches the old
  // express-validator config; rejects loose inputs like '2024-01-01 12:00'.
  timestamp: z.iso.datetime({ offset: true }),
  // ids of elements currently visible. Used in addition to "elements
  // resurrected via REMOVE revisions" so the latest pre-timestamp state
  // is fetched for everything the FE rendered.
  elementIds: z.array(z.coerce.number().int()).default([]),
});

export type TimeTravelInput = z.infer<typeof TimeTravelInput>;
