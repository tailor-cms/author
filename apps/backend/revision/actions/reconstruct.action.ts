import {
  RepositoryScopedParams,
  dataEnvelope,
} from '#shared/request/schemas.ts';
import { oneLine } from 'common-tags';
import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../revision.service.ts';

// GET /repositories/:repositoryId/revisions/reconstruct
// Single read primitive behind both the editor history preview (pass
// `against` = the previous revision's timestamp for a diff) and the
// publish-diff overlay (omit `against`, reconstruction only).
export default defineAction({
  name: 'reconstruct',
  params: RepositoryScopedParams,
  query: schemas.ReconstructInput,
  openapi: {
    authenticated: true,
    summary: 'Reconstruct an activity subtree at a moment',
    description: oneLine`
      Rebuilds the activity's whole subtree as it existed at \`at\`. When
      \`against\` is supplied, each returned entity is tagged with how it
      changed (new / changed / removed) between the two moments.
    `,
    responses: {
      200: {
        description: 'Reconstructed subtree state at the target moment.',
        schema: dataEnvelope(schemas.ReconstructResult),
      },
      404: { description: 'Activity not found in this repository.' },
    },
  },
  async handler({ query, req }) {
    return service.reconstruct(req.activity!, query.at, query.against ?? null);
  },
});
