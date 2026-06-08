import {
  RepositoryScopedParams,
  dataEnvelope,
} from '#shared/request/schemas.ts';
import { oneLine } from 'common-tags';
import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../revision.service.ts';

export default defineAction({
  params: RepositoryScopedParams,
  query: schemas.TimeTravelInput,
  openapi: {
    authenticated: true,
    summary: 'Time-travel an activity',
    description: oneLine`
      Reconstructs an activity and its descendant element state at a
      target moment. Used by the FE PublishDiff view to show what was
      published.
    `,
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
