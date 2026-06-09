import pick from 'lodash/pick.js';
import { UserActivity } from '@tailor-cms/common/src/sse.js';
import sse from '#shared/sse/index.js';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import { USER_SUMMARY_ATTRS } from '#app/user/schemas/entity.ts';
import { addContext } from '../store.ts';
import * as schemas from '../schemas/index.ts';

// POST /repositories/:repositoryId/feed
// Appends a presence context (current focus, etc.) to the user's
// active-context list and broadcasts a Start event over SSE.
async function handler({
  body,
  user,
  res,
}: Ctx<{
  body: typeof schemas.AddInput;
  params: typeof schemas.FeedItemParams;
}>) {
  res.end();
  const userInfo = pick(user, USER_SUMMARY_ATTRS);
  await addContext(userInfo, body.context);
  sse.channel(body.context.repositoryId).send(UserActivity.Start, {
    user: userInfo,
    context: body.context,
  });
}

export default defineAction({
  name: 'recordActivity',
  params: schemas.FeedItemParams,
  body: schemas.AddInput,
  openapi: {
    authenticated: true,
    summary: 'Add a user activity context',
  },
  handler,
});
