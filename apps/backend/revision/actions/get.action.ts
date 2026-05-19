import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../revision.schema.ts';

// GET /repositories/:repositoryId/revisions/:revisionId
// The `getRevision` param middleware loads the row, enforces repository
// scoping, and returns 404 otherwise. This handler is a thin pass-through.
export default defineAction({
  raw: true,
  params: schemas.GetParams,
  openapi: {
    summary: 'Get a single revision',
    authenticated: true,
  },
  async handler({ req }) {
    return req.revision!;
  },
});
