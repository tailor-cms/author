import { z } from 'zod';
import { defineAction } from '#shared/request/action.ts';
import * as service from '../activity.service.ts';

// POST /repositories/:repositoryId/activities
// Creates an activity under the scoped repository. `repositoryId` is
// always taken from the loaded repo, never the body. Outline-level
// activities are seeded with the schema's `defaultMeta` so their `data`
// blob lands with the right shape for the FE editor.
const Body = z.object({
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
export type CreateBody = z.infer<typeof Body>;

export default defineAction({
  body: Body,
  openapi: {
    summary: 'Create an activity',
    authenticated: true,
  },
  async handler({ body, user, req }) {
    return service.create(req.repository!, user, body);
  },
});
