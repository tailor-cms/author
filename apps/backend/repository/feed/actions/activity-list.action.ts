import { defineAction } from '#shared/request/action.ts';
import { getActiveUsers } from '../store.ts';

// GET /repositories/:repositoryId/feed
// Returns the currently-active users (with their contexts) on the feed.
export default defineAction({
  openapi: {
    summary: 'List currently-active users on the feed',
    authenticated: true,
  },
  async handler() {
    const items = await getActiveUsers();
    return { items };
  },
});
