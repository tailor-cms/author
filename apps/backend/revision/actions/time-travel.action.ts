import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../revision.schema.ts';
import * as service from '../revision.service.ts';

// GET /repositories/:repositoryId/revisions/time-travel
// Reconstructs the state of an activity (and its descendants' elements)
// at `timestamp`. The FE uses it for "show what was published" diffing -
// it sends the current element ids and the publish timestamp.
export default defineAction({
  query: schemas.TimeTravelQuery,
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
