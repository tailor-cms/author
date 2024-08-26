import config from '../../config/server/index.js';
import Keyv from 'keyv';

const store = new Keyv({
  store: config.kvStore.store,
  namespace: 'active-users',
  ttl: 60 * 1000, // 1 minute in milliseconds
});

async function addContext(user, context) {
  const record = await findOrCreate(user);
  const contexts = [...record.contexts, context];
  return store.set(user.id, { ...record, contexts });
}

async function removeContext(user, predicate) {
  const record = await store.get(user.id);
  if (!record) return;
  const contexts = record.contexts.filter((it) => !predicate(it));
  if (!contexts.length) return store.delete(user.id);
  return store.set(user.id, { ...record, contexts });
}

async function getActiveUsers() {
  const users = [];
  for await (const [, value] of store.iterator()) {
    users.push(value);
  }
  return users.reduce((acc, user) => ({ ...acc, [user.id]: user }), {});
}

async function findOrCreate(user) {
  const hasKey = await store.has(user.id);
  if (!hasKey) {
    const connectedAt = new Date();
    await store.set(user.id, { ...user, connectedAt, contexts: [] });
  }
  return store.get(user.id);
}

export { addContext, removeContext, getActiveUsers, store };
