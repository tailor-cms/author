import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../revision.schema.ts';

// GET /repositories/:repositoryId/revisions/:revisionId
// The `getRevision` param middleware loads the record, enforces repository
// scoping, and returns 404 otherwise. This handler is a thin pass-through.
export default defineAction({
  raw: true,
  params: schemas.GetParams,
  openapi: {
    summary: 'Get a revision',
    description: 'Loads a single revision record scoped to the repository.',
    authenticated: true,
    responses: {
      200: {
        description: 'The revision record.',
        schema: schemas.Revision,
      },
      404: { description: 'Revision not found in this repository.' },
    },
  },
  async handler({ req }) {
    return req.revision!;
  },
});
