import * as actions from './actions/index.ts';
import { createActionMounter } from '#shared/request/action.ts';
import { getThread } from './middleware.ts';
import express from 'express';

const router = express.Router({ mergeParams: true });
const basePath = '/repositories/:repositoryId/messaging';

const threads = createActionMounter(router, basePath, {
  tag: 'Threads',
  group: 'Messaging',
});
const readState = createActionMounter(router, basePath, {
  tag: 'Read state',
  group: 'Messaging',
});

router.param('threadId', getThread);

threads
  .post('/threads/typing', actions.typing)
  .get('/threads/topics', actions.topics);

readState
  .get('/threads/unread', actions.unread)
  .post('/threads/seen', actions.markAllRead);

threads
  .get('/threads', actions.list)
  .post('/threads', actions.create)
  .get('/threads/:threadId', actions.get)
  .get('/threads/:threadId/messages', actions.messages)
  .post('/threads/:threadId/resolve', actions.resolve)
  .put('/threads/:threadId/subscriptions', actions.subscriptions)
  .put('/threads/:threadId/star', actions.star)
  .delete('/threads/:threadId', actions.remove);

readState.post('/threads/:threadId/seen', actions.markRead);

export default router;
