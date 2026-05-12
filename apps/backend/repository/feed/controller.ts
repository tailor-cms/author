import type { Response } from 'express';
import isEqual from 'lodash/isEqual.js';
import pick from 'lodash/pick.js';
import { UserActivity } from '@tailor-cms/common/src/sse.js';
import { addContext, getActiveUsers, removeContext } from './store.ts';
import sse from '#shared/sse/index.js';
import type { RepositoryItemRequest } from '../types.ts';
import type { Repository } from '../repository.model.js';

const USER_ATTRS = [
  'id',
  'email',
  'firstName',
  'lastName',
  'fullName',
  'label',
  'imgUrl',
];

export function subscribe(
  { repository, user }: RepositoryItemRequest,
  { sse: connection }: any,
) {
  connection.once('close', () =>
    onUnsubscribe(connection, { repository, user }),
  );
  connection.join(repository.id);
}

async function onUnsubscribe(
  connection: any,
  { repository, user }: { repository: Repository; user: any },
) {
  await removeContext(user, (it: any) => it.sseId === connection.id);
  sse
    .channel(repository.id)
    .send(UserActivity.EndSession, { sseId: connection.id, userId: user.id });
}

export async function fetchUserActivities(
  _req: RepositoryItemRequest,
  res: Response,
) {
  const items = await getActiveUsers();
  res.json({ data: { items } });
}

export async function addUserActivity(
  { user, body: { context } }: RepositoryItemRequest,
  res: Response,
) {
  res.end();
  user = pick(user, USER_ATTRS);
  await addContext(user, context);
  sse.channel(context.repositoryId).send(UserActivity.Start, { user, context });
}

export async function removeUserActivity(
  { user, body: { context } }: RepositoryItemRequest,
  res: Response,
) {
  res.end();
  user = pick(user, USER_ATTRS);
  // Strip the timestamp before matching: contexts are equivalence-checked
  // by the user-supplied keys only.
  const { connectedAt: _connectedAt, ...targetCtx } = context;
  const compareBy = Object.keys(targetCtx);
  await removeContext(user, (it: any) => isEqual(pick(it, compareBy), targetCtx));
  sse.channel(context.repositoryId).send(UserActivity.End, { user, context });
}
