import { UserActivity } from '@tailor-cms/common/src/sse.js';
import sse from '#shared/sse/index.js';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import type { Repository } from '../../repository.model.js';
import { removeContext } from '../store.ts';

// Minimal slice of the runtime SSEConnection API we use here.
interface SSEConnection {
  id: string;
  once(event: 'close', cb: () => void): unknown;
  join(channel: string | number): unknown;
}

// GET /repositories/:repositoryId/feed/subscribe
// Opens an SSE connection scoped to the repository. The `sse` middleware
// attaches an SSEConnection to `res.sse` and writes the initial headers,
// so the defineAction wrapper sees `res.headersSent` and bails.
async function handler({ user, req, res }: Ctx) {
  const repository = req.repository!;
  const connection = (res as unknown as { sse: SSEConnection }).sse;
  connection.once('close', () =>
    onUnsubscribe(connection, repository, user),
  );
  connection.join(repository.id);
}

async function onUnsubscribe(
  connection: SSEConnection,
  repository: Repository,
  user: any,
) {
  await removeContext(user, (it: { sseId?: string }) =>
    it.sseId === connection.id,
  );
  sse.channel(repository.id).send(UserActivity.EndSession, {
    sseId: connection.id,
    userId: user.id,
  });
}

export default defineAction({
  openapi: {
    summary: 'Subscribe to repository activity feed (SSE)',
    authenticated: true,
  },
  handler,
});
