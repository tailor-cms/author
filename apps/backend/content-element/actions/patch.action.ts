import { z } from 'zod';
import { defineAction } from '#shared/request/action.ts';
import * as service from '../content-element.service.ts';

// PATCH /repositories/:repositoryId/content-elements/:elementId
// Updates mutable fields. Passing `deletedAt: null` restores a previously
// soft-deleted element.
const Body = z.object({
  // Note: `type` is intentionally NOT patchable. The type id is the
  // element's identity (it determines which plugin's hooks + data shape
  // apply); changing it post-creation would orphan `data` against the
  // wrong plugin.
  //
  // Replacement `data` bag (JSONB). Each Content Element pkg manifest
  // declares its own `ElementData` interface (extending the common
  // `ElementConfig`);
  data: z.record(z.string(), z.unknown()).optional(),
  // New position among siblings; model validator gates 0..1_000_000.
  position: z.number().min(0).max(1_000_000).optional(),
  // Replacement configurable input data bag (JSONB).
  // Additional schema based configuration attached to the element
  // e.g. captions, labels, system specific config one might want to
  // store with the element.
  meta: z.record(z.string(), z.unknown()).optional(),
  // Replacement element refs bag (JSONB). The repository schema
  // configures each element type's allowed relationship keys via
  // `elementMeta.relationships[]` (e.g. `related`); each value is a
  // list of `{ id, uid?, outlineId, containerId }` pointers.
  refs: z.record(z.string(), z.unknown()).optional(),
  // Restore from soft delete: `null` brings the row back.
  deletedAt: z.null().optional(),
});
export type PatchBody = z.infer<typeof Body>;

export default defineAction({
  body: Body,
  openapi: {
    summary: 'Patch a content element',
    authenticated: true,
  },
  async handler({ body, user, req }) {
    return service.update(req.repository!, user, req.contentElement!, body);
  },
});
