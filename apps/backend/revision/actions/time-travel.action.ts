import { oneLine } from 'common-tags';
import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';
import * as schemas from '../revision.schema.ts';
import * as service from '../revision.service.ts';

// GET /repositories/:repositoryId/revisions/time-travel
// Reconstructs the state of an activity (and its descendants' elements)
// at `timestamp`. The FE uses it for "show what was published" diffing -
// it sends the current element ids and the publish timestamp.
export default defineAction({
  params: schemas.TimeTravelParams,
  query: schemas.TimeTravelInput,
  openapi: {
    summary: 'Time-travel an activity',
    description: oneLine`
      Reconstructs an activity and its descendants' element state at a
      target moment. Used by the FE PublishDiff view to show what was
      published.
    `,
    authenticated: true,
    responses: {
      200: {
        description:
          'Reconstructed activity + element revisions at the target moment.',
        schema: dataEnvelope(schemas.TimeTravelResult),
      },
      404: { description: 'Activity not found in this repository.' },
    },
  },
  async handler({ query, req }) {
    return service.timeTravel(req.activity!, {
      timestamp: query.timestamp,
      elementIds: query.elementIds,
    });
  },
});
