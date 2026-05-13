import { z } from 'zod';
import pick from 'lodash/pick.js';
import type { UserActivityContext } from '@tailor-cms/interfaces';
import { UserActivity } from '@tailor-cms/common/src/sse.js';
import sse from '#shared/sse/index.js';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import { addContext } from '../store.ts';

const USER_ATTRS = [
  'id', 'email', 'firstName', 'lastName', 'fullName', 'label', 'imgUrl',
];

// POST /repositories/:repositoryId/feed
// Appends a presence context (current focus, etc.) to the user's
// active-context list and broadcasts a Start event over SSE.
// `looseObject` keeps the door open for new focus keys (page, view, ...)
const Context: z.ZodType<UserActivityContext> = z.looseObject({
  repositoryId: z.number().int(),
  sseId: z.string().optional(),
  activityId: z.number().int().optional(),
  elementId: z.number().int().optional(),
});

const Body = z.object({ context: Context });

async function handler({ body, user, res }: Ctx<{ body: typeof Body }>) {
  // FE fires-and-forgets these calls, so respond immediately and run the
  // store + broadcast as a side effect.
  res.end();
  const userInfo = pick(user, USER_ATTRS);
  await addContext(userInfo, body.context);
  sse.channel(body.context.repositoryId).send(UserActivity.Start, {
    user: userInfo,
    context: body.context,
  });
}

export default defineAction({
  body: Body,
  openapi: {
    summary: 'Add a user activity context',
    authenticated: true,
  },
  handler,
});
