import type {
  UserActivityContext,
  UserActivityContextStored,
} from '@tailor-cms/interfaces';
import Keyv from 'keyv';

import config from '#config';

// Picked subset of `User` shipped over SSE alongside presence events.
// Mirrors the `USER_ATTRS` projection in `feed/actions/common.ts`.
export interface FeedUser {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  label: string;
  imgUrl: string;
}

interface PresenceRecord extends FeedUser {
  connectedAt: Date;
  contexts: UserActivityContextStored[];
}

const store = new Keyv<PresenceRecord>({
  ...config.kvStore.keyvDefaultConfig,
  namespace: 'active-users',
  ttl: 60 * 1000, // 1 minute in milliseconds
});

// Keyv keys are strings; the User id is numeric so we coerce at the
// boundary. Centralised here so individual call sites read clean.
const keyOf = (user: FeedUser) => String(user.id);

// Appends a presence context (e.g. focused activity) to the user's
// active-context list, creating the user record on first call.
async function addContext(user: FeedUser, context: UserActivityContext) {
  const record = await findOrCreate(user);
  const contexts = [...record!.contexts, context as UserActivityContextStored];
  return store.set(keyOf(user), { ...record!, contexts });
}

// Removes any of the user's stored contexts matching the predicate;
// drops the user record entirely once their context list goes empty.
async function removeContext(
  user: FeedUser,
  predicate: (it: UserActivityContextStored) => boolean,
) {
  const record = await store.get(keyOf(user));
  if (!record) return;
  const contexts = record.contexts.filter((it) => !predicate(it));
  if (!contexts.length) return store.delete(keyOf(user));
  return store.set(keyOf(user), { ...record, contexts });
}

// Returns the in-memory map of currently-active users keyed by user id.
async function getActiveUsers() {
  const users: PresenceRecord[] = [];
  for await (const [, value] of (store as any).iterator()) {
    users.push(value);
  }
  return users.reduce<Record<number, PresenceRecord>>(
    (acc, user) => ({ ...acc, [user.id]: user }),
    {},
  );
}

async function findOrCreate(user: FeedUser): Promise<PresenceRecord | undefined> {
  const hasKey = await store.has(keyOf(user));
  if (!hasKey) {
    const connectedAt = new Date();
    await store.set(keyOf(user), { ...user, connectedAt, contexts: [] });
  }
  return store.get(keyOf(user));
}

export { addContext, removeContext, getActiveUsers, store };
