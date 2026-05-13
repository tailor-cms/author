import { defineAction } from '#shared/request/action.ts';

// GET /repositories/:repositoryId/references/validate
export default defineAction({
  openapi: {
    summary: 'Validate cross-model references in the repository',
    authenticated: true,
  },
  async handler({ req }) {
    return req.repository!.validateReferences();
  },
});
