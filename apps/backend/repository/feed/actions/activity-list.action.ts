import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';
import * as schemas from '../schemas/index.ts';
import { getActiveUsers } from '../store.ts';

// GET /repositories/:repositoryId/feed
// Returns the currently-active users (with their contexts) on the feed.
export default defineAction({
  params: schemas.FeedItemParams,
  openapi: {
    authenticated: true,
    summary: 'List currently-active users on the feed',
    responses: {
      200: {
        description: 'Map of active users keyed by user id.',
        schema: dataEnvelope(schemas.ListResult),
      },
    },
  },
  async handler() {
    const items = await getActiveUsers();
    return { items };
  },
});
