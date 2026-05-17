import { z } from 'zod';
import { defineAction } from '#shared/request/action.ts';
import { IntParam } from '#shared/request/schemas.ts';

// GET /repositories/:repositoryId/revisions/:revisionId
// The `getRevision` param middleware loads the row, enforces repository
// scoping, and returns 404 otherwise. This handler is a thin pass-through.
const Params = z.object({
  revisionId: IntParam(),
});

export default defineAction({
  raw: true,
  params: Params,
  openapi: {
    summary: 'Get a single revision',
    authenticated: true,
  },
  async handler({ req }) {
    return req.revision!;
  },
});
