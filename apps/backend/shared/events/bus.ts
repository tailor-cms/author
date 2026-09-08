// Repository event bus.
//
// Domain events are published as CloudEvents 1.0 envelopes and delivered
// to whatever subscribed - today the channel reporters. CloudEvents is
// used verbatim rather than an in-house shape so an event is
// immediately consumable by anything that already speaks it, and
// because `subject` is specified for exactly the routing we need
// (`repository/42/activity/7`).
//
// Transport is an in-process emitter. Nothing about the envelope or the
// subscribe API assumes that; swapping in Redis pub/sub for a
// multi-instance deployment is a change behind `publish`.
import { EventEmitter } from 'node:events';
import { createId as cuid } from '@paralleldrive/cuid2';
import { createLogger } from '#logger';

const logger = createLogger('events');

const CHANNEL = 'cloudevent';
const SPEC_VERSION = '1.0';

// The catalog. Deliberately curated: a repository generates a revision
// on every element save, and piping that volume into a conversation
// would bury it. Only events a person would want announced are here.
//
// Every entry has a producer and is offered as a subscribable topic. An
// entry with neither is a promise the system does not keep, so add one
// with its `publishSafe` call, not ahead of it.
export const EventType = {
  RepositoryPublished: 'com.tailorcms.repository.published',
  ActivityCreated: 'com.tailorcms.activity.created',
  ActivityRemoved: 'com.tailorcms.activity.removed',
  ActivityStatusChanged: 'com.tailorcms.activity.status_changed',
  AssetUploaded: 'com.tailorcms.asset.uploaded',
} as const;

export type EventType = (typeof EventType)[keyof typeof EventType];

// Human labels for the catalog, so a subscription UI never has to guess
// what a CloudEvents type means. Lives with the types it describes -
// adding an event and forgetting its label is then one diff, not two.
export const EVENT_CATALOG = [
  {
    topic: EventType.RepositoryPublished,
    label: 'Publishing',
    description: 'When content is published.',
  },
  {
    topic: EventType.ActivityCreated,
    label: 'Items added',
    description: 'When an item is added to the structure.',
  },
  {
    topic: EventType.ActivityRemoved,
    label: 'Items removed',
    description: 'When an item is removed from the structure.',
  },
  {
    topic: EventType.ActivityStatusChanged,
    label: 'Workflow changes',
    description: 'When an item moves between workflow statuses.',
  },
  {
    topic: EventType.AssetUploaded,
    label: 'Asset uploads',
    description: 'When files are added to the asset library.',
  },
];

export interface CloudEvent<T = Record<string, unknown>> {
  specversion: typeof SPEC_VERSION;
  id: string;
  source: string;
  type: string;
  subject?: string;
  time: string;
  datacontenttype: 'application/json';
  data: T;
  // Not part of the wire envelope; carried so subscribers can scope
  // delivery without re-parsing `source`.
  repositoryId: number;
  // Who caused this. Carried beside `repositoryId` rather than inside
  // `data`, which describes the resource and not the person. Null for
  // system-initiated writes (imports, linked-content sync).
  actorId?: number | null;
}

const emitter = new EventEmitter();
// Reporters plus any registered plugin handlers; the default of 10 is
// low for a platform extension point.
emitter.setMaxListeners(64);

export type EventHandler = (event: CloudEvent) => void | Promise<void>;

export function subscribe(handler: EventHandler) {
  emitter.on(CHANNEL, handler);
  return () => emitter.off(CHANNEL, handler);
}

interface PublishInput {
  type: EventType | string;
  repositoryId: number;
  actorId?: number | null;
  subject?: string;
  data?: Record<string, unknown>;
}

/**
 * Publishes a domain event. Fire-and-forget by design: a failing
 * subscriber must never break the operation that produced the event.
 */
export function publish(input: PublishInput): CloudEvent {
  const event: CloudEvent = {
    specversion: SPEC_VERSION,
    id: cuid(),
    source: `/tailor/repository/${input.repositoryId}`,
    type: input.type,
    subject: input.subject ?? `repository/${input.repositoryId}`,
    time: new Date().toISOString(),
    datacontenttype: 'application/json',
    data: input.data ?? {},
    repositoryId: input.repositoryId,
    actorId: input.actorId ?? null,
  };
  logger.debug({ type: event.type, subject: event.subject }, 'Event published');
  // `setImmediate` keeps delivery off the producing request's critical
  // path; handlers own their errors.
  setImmediate(() => {
    try {
      emitter.emit(CHANNEL, event);
    } catch (err) {
      logger.warn({ err, type: event.type }, 'Event delivery failed');
    }
  });
  return event;
}

/**
 * Safe producer helper: publishing must never take down the caller.
 */
export function publishSafe(input: PublishInput) {
  try {
    return publish(input);
  } catch (err) {
    logger.warn({ err, type: input.type }, 'Event publish failed');
    return null;
  }
}
