import type { UserActivityContext } from '@tailor-cms/interfaces';
import Keyv from 'keyv';

import config from '#config';
import type {
  FeedPresenceRecord,
  StoredUserActivityContext,
} from './schemas/index.ts';
import type { UserSummary } from '#app/user/schemas/entity.ts';

// Re-export for convenience
export type FeedUser = UserSummary;

const store = new Keyv<FeedPresenceRecord>({
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
  const contexts = [...record!.contexts, context as StoredUserActivityContext];
  return store.set(keyOf(user), { ...record!, contexts });
}

// Removes any of the user's stored contexts matching the predicate;
// drops the user record entirely once their context list goes empty.
async function removeContext(
  user: FeedUser,
  predicate: (it: StoredUserActivityContext) => boolean,
) {
  const record = await store.get(keyOf(user));
  if (!record) return;
  const contexts = record.contexts.filter((it) => !predicate(it));
  if (!contexts.length) return store.delete(keyOf(user));
  return store.set(keyOf(user), { ...record, contexts });
}

// Returns the in-memory map of currently-active users keyed by user id.
async function getActiveUsers() {
  const users: FeedPresenceRecord[] = [];
  for await (const [, value] of (store as any).iterator()) {
    users.push(value);
  }
  return users.reduce<Record<number, FeedPresenceRecord>>(
    (acc, user) => ({ ...acc, [user.id]: user }),
    {},
  );
}

async function findOrCreate(
  user: FeedUser,
): Promise<FeedPresenceRecord | undefined> {
  const hasKey = await store.has(keyOf(user));
  if (!hasKey) {
    const connectedAt = new Date().toISOString();
    await store.set(keyOf(user), { ...user, connectedAt, contexts: [] });
  }
  return store.get(keyOf(user));
}

export { addContext, removeContext, getActiveUsers, store };
