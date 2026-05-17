import { z } from 'zod';
import { defineAction } from '#shared/request/action.ts';
import { IntParam } from '#shared/request/schemas.ts';
import * as service from '../revision.service.ts';

// GET /repositories/:repositoryId/revisions/time-travel
// Reconstructs the state of an activity (and its descendants' elements)
// at `timestamp`. The FE uses it for "show what was published" diffing -
// it sends the current element ids and the publish timestamp.
const Query = z.object({
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
export type TimeTravelQuery = z.infer<typeof Query>;

export default defineAction({
  query: Query,
  openapi: {
    summary: 'Reconstruct an activity\'s element state at a given moment',
    authenticated: true,
  },
  async handler({ query, req }) {
    return service.timeTravel(req.activity!, {
      timestamp: query.timestamp,
      elementIds: query.elementIds,
    });
  },
});
