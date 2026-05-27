import { defineAction } from '#shared/request/action.ts';
import {
  RepositoryScopedParams,
  dataEnvelope,
} from '#shared/request/schemas.ts';

import * as schemas from '../schemas/index.ts';
import * as service from '../activity.service.ts';

// POST /repositories/:repositoryId/activities/link
// Links an activity tree from (potentially) another repository into the
// target. The `hasLinkSourceAccess` middleware verifies the caller has
// access to the source before this fires.
export default defineAction({
  params: RepositoryScopedParams,
  body: schemas.LinkInput,
  openapi: {
    authenticated: true,
    summary: 'Link an activity from another repository',
    description: 'Creates a linked-copy tree of the source under the target.',
    responses: {
      200: {
        description: 'Linked-copy entry point in the target repository.',
        schema: dataEnvelope(schemas.Activity),
      },
      403: { description: 'No access to the source repository.' },
      404: { description: 'Source activity not found.' },
    },
  },
  async handler({ body, user, req }) {
    return service.link(req.repository!, user, body);
  },
});
