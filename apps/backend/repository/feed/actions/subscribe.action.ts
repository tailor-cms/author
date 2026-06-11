import { oneLine } from 'common-tags';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import { removeContext, type FeedUser } from '../store.ts';
import type { Repository } from '../../models/repository.model.js';
import sse from '#shared/sse/index.js';
import type { User } from '../../../user/models/user.model.js';
import { UserActivity } from '@tailor-cms/common/src/sse.js';
import * as schemas from '../schemas/index.ts';

// Minimal slice of the runtime SSEConnection API we use here.
interface SSEConnection {
  id: string;
  once(event: 'close', cb: () => void): unknown;
  join(channel: string | number): unknown;
}

// GET /repositories/:repositoryId/feed/subscribe
// Opens an SSE connection scoped to the repository. The `sse` middleware
// attaches an SSEConnection to `res.sse` and writes the initial headers.
async function handler({
  user,
  req,
  res,
}: Ctx<{ params: typeof schemas.FeedItemParams }>) {
  const repository = req.repository!;
  const connection = (res as unknown as { sse: SSEConnection }).sse;
  connection.once('close', () => onUnsubscribe(connection, repository, user));
  connection.join(repository.id);
}

async function onUnsubscribe(
  connection: SSEConnection,
  repository: Repository,
  user: User,
) {
  await removeContext(
    user as unknown as FeedUser,
    (it) => it.sseId === connection.id,
  );
  sse.channel(repository.id).send(UserActivity.EndSession, {
    sseId: connection.id,
    userId: user.id,
  });
}

export default defineAction({
  name: 'subscribeFeed',
  params: schemas.FeedItemParams,
  openapi: {
    authenticated: true,
    summary: 'Subscribe to repository activity feed (SSE)',
    description: oneLine`
      Opens a long-lived SSE connection scoped to the repository; clients
      receive presence and content-change events until the socket closes.
    `,
  },
  handler,
});
