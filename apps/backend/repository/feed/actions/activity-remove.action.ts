import { defineAction, type Ctx } from '#shared/request/action.ts';
import * as schemas from '../schemas/index.ts';
import isEqual from 'lodash/isEqual.js';
import pick from 'lodash/pick.js';
import { UserActivity } from '@tailor-cms/common/src/sse.js';
import sse from '#shared/sse/index.js';
import { removeContext } from '../store.ts';
import type { StoredUserActivityContext } from '../schemas/index.ts';
import { USER_SUMMARY_ATTRS } from '#app/user/user.schema.ts';

// DELETE /repositories/:repositoryId/feed
async function handler({
  body,
  user,
  res,
}: Ctx<{
  body: typeof schemas.RemoveInput;
  params: typeof schemas.FeedItemParams;
}>) {
  res.end();
  const userInfo = pick(user, USER_SUMMARY_ATTRS);
  // Strip the timestamp before matching
  const { connectedAt: _connectedAt, ...targetCtx } = body.context as Record<
    string,
    unknown
  >;
  const compareBy = Object.keys(targetCtx);
  await removeContext(userInfo, (it: StoredUserActivityContext) =>
    isEqual(pick(it, compareBy), targetCtx),
  );
  sse.channel(body.context.repositoryId).send(UserActivity.End, {
    user: userInfo,
    context: body.context,
  });
}

export default defineAction({
  params: schemas.FeedItemParams,
  body: schemas.RemoveInput,
  openapi: {
    authenticated: true,
    summary: 'Remove a user activity context',
  },
  handler,
});
