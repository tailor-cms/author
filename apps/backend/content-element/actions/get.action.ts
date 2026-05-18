import { defineAction } from '#shared/request/action.ts';

// GET /repositories/:repositoryId/content-elements/:elementId
// The `getContentElement` param middleware loads the entry, enforces
// repository scoping, and returns 404/403 otherwise. This handler is a
// thin pass-through.
export default defineAction({
  openapi: {
    summary: 'Get a single content element by id',
    authenticated: true,
  },
  async handler({ req }) {
    return req.contentElement!;
  },
});
