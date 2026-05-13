import type {
  UserActivityContext,
  UserActivityContextStored,
} from '@tailor-cms/interfaces';
import { z } from 'zod';
import isEqual from 'lodash/isEqual.js';
import pick from 'lodash/pick.js';
import { UserActivity } from '@tailor-cms/common/src/sse.js';
import sse from '#shared/sse/index.js';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import { removeContext } from '../store.ts';

const USER_ATTRS = [
  'id', 'email', 'firstName', 'lastName', 'fullName', 'label', 'imgUrl',
];

// DELETE /repositories/:repositoryId/feed
// Removes any of the user's stored contexts whose keys (ignoring
// connectedAt) match the supplied context, and broadcasts an End event.
const Context: z.ZodType<UserActivityContext> = z.looseObject({
  repositoryId: z.number().int(),
  sseId: z.string().optional(),
  activityId: z.number().int().optional(),
  elementId: z.number().int().optional(),
});

const Body = z.object({ context: Context });

async function handler({ body, user, res }: Ctx<{ body: typeof Body }>) {
  res.end();
  const userInfo = pick(user, USER_ATTRS);
  // Strip the timestamp before matching: contexts are equivalence-checked
  // by the user-supplied keys only.
  const { connectedAt: _connectedAt, ...targetCtx } = body.context;
  const compareBy = Object.keys(targetCtx);
  await removeContext(
    userInfo,
    (it: UserActivityContextStored) =>
      isEqual(pick(it, compareBy), targetCtx),
  );
  sse.channel(body.context.repositoryId).send(UserActivity.End, {
    user: userInfo,
    context: body.context,
  });
}

export default defineAction({
  body: Body,
  openapi: {
    summary: 'Remove a user activity context',
    authenticated: true,
  },
  handler,
});
