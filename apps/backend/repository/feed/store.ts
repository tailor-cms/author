import Keyv from 'keyv';
import config from '#config';

const store = new Keyv({
  ...config.kvStore.keyvDefaultConfig,
  namespace: 'active-users',
  ttl: 60 * 1000, // 1 minute in milliseconds
});

// Appends a presence context (e.g. focused activity) to the user's
// active-context list, creating the user record on first call.
async function addContext(user: any, context: any) {
  const record = await findOrCreate(user);
  const contexts = [...record.contexts, context];
  return store.set(user.id, { ...record, contexts });
}

// Removes any of the user's stored contexts matching the predicate;
// drops the user record entirely once their context list goes empty.
async function removeContext(user: any, predicate: (it: any) => boolean) {
  const record = await store.get(user.id);
  if (!record) return;
  const contexts = record.contexts.filter((it: any) => !predicate(it));
  if (!contexts.length) return store.delete(user.id);
  return store.set(user.id, { ...record, contexts });
}

// Returns the in-memory map of currently-active users keyed by user id.
async function getActiveUsers() {
  const users: any[] = [];
  for await (const [, value] of (store as any).iterator()) {
    users.push(value);
  }
  return users.reduce((acc, user) => ({ ...acc, [user.id]: user }), {});
}

async function findOrCreate(user: any) {
  const hasKey = await store.has(user.id);
  if (!hasKey) {
    const connectedAt = new Date();
    await store.set(user.id, { ...user, connectedAt, contexts: [] });
  }
  return store.get(user.id);
}

export { addContext, removeContext, getActiveUsers, store };
