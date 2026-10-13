// What a thread listens to: repository events and integration posts.
import type { Thread } from './models/thread.model.js';
import { ThreadNotSubscribableError, UnknownTopicError } from '../errors.ts';
import { IntegrationType, ThreadType } from '@tailor-cms/interfaces/comment';
import { broadcast } from './thread.service.ts';
import { Op } from 'sequelize';
import { Thread as Events } from '@tailor-cms/common/src/sse.js';
import { EVENT_CATALOG } from '#shared/events/bus.ts';
import { createLogger } from '#logger';
import db from '#shared/database/index.js';

const models = () => db as any;

const logger = createLogger('messaging:subscription');

/**
 * Threads in a repository that asked for a source.
 */
export function subscribedThreads(repositoryId: number, topic: string) {
  const { Thread } = models();
  return Thread.findAll({
    where: { repositoryId, subscriptions: { [Op.contains]: [topic] } },
  });
}

/**
 * Replaces what a thread subscribes to. Free-standing / non-anchored
 * threads only.
 */
export async function setSubscriptions(thread: Thread, topics: string[]) {
  if (topics.length && thread.type !== ThreadType.Repository) {
    throw new ThreadNotSubscribableError();
  }
  await assertKnownTopics(thread.repositoryId, topics);
  await thread.update({ subscriptions: topics });
  await broadcast(thread.id, Events.Update);
  logger.debug({ threadId: thread.id, topics }, 'Thread subscriptions updated');
}

/**
 * Everything a thread can subscribe to: the event catalog plus
 * the integrations registered on it.
 */
export async function listTopics(repositoryId: number) {
  const { Integration } = models();
  const integrations = await Integration.findAll({
    where: { repositoryId, type: IntegrationType.External, isEnabled: true },
    order: [['createdAt', 'ASC']],
  });
  return [
    ...EVENT_CATALOG,
    ...integrations.map((it: any) => ({
      topic: `integration:${it.key}`,
      label: it.name,
      description: 'Posts received on this integration webhook.',
    })),
  ];
}

async function assertKnownTopics(repositoryId: number, topics: string[]) {
  if (!topics.length) return;
  const known = new Set(
    (await listTopics(repositoryId)).map((it) => it.topic as string),
  );
  const unknown = [...new Set(topics)].filter((it) => !known.has(it));
  if (unknown.length) throw new UnknownTopicError(unknown);
}
