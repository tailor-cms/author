// Repository event bus.
// Domain events are published as CloudEvents 1.0 envelopes and delivered
// to whatever subscribed;
//
// CloudEvents 1.0 (https://cloudevents.io, CNCF) - the envelope, for
// reference. Attribute names are lowercase by spec; every field on the
// event is a wire attribute, so it can be handed over as-is.
//
//   REQUIRED
//   specversion      "1.0"
//   id               unique per source; here a cuid
//   source           the context it happened in, as a URI - the spec
//                    wants an absolute one so two deployments never
//                    collide; here the repository:
//                    `https://author.example.com/repository/42`
//   type             what happened, reverse-DNS by convention;
//                    here `com.tailorcms.activity.published`
//   OPTIONAL
//   subject          what it is about, relative to `source` - the
//                    spec's example is a storage container as source
//                    and the blob name as subject; here `activity/7`,
//                    `asset/12`
//   time             RFC 3339 timestamp of the occurrence
//   datacontenttype  media type of `data`; here `application/json`
//   dataschema       URI of the schema `data` follows - not used
//   PAYLOAD
//   data             the body, shaped per `type`
//   EXTENSIONS
//   Anything else is an extension attribute - ours are defined at
//   `CloudEvent` below.
//
// Transport is an in-process emitter, which on a single instance gives
// each event exactly one delivery.
import { EventEmitter } from 'node:events';
import { createId as cuid } from '@paralleldrive/cuid2';
import { createLogger } from '#logger';
import config from '#config';

const logger = createLogger('events');

const CHANNEL = 'cloudevent';
const SPEC_VERSION = '1.0';

// The event type catalog.
export const EventType = {
  ActivityPublished: 'com.tailorcms.activity.published',
  ActivityCreated: 'com.tailorcms.activity.created',
  ActivityRemoved: 'com.tailorcms.activity.removed',
  ActivityStatusChanged: 'com.tailorcms.activity.status_changed',
  AssetUploaded: 'com.tailorcms.asset.uploaded',
} as const;

export type EventType = (typeof EventType)[keyof typeof EventType];

// Human labels for the event catalog
export const EVENT_CATALOG = [
  {
    topic: EventType.ActivityPublished,
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

// What an event is about, relative to its repository (as a resource
// path, not a route)
export const subjectOf = {
  activity: (id: number) => `activity/${id}`,
  asset: (id: number) => `asset/${id}`,
};

// The context an event happened in: the repository, on this deployment.
const sourceOf = (repositoryId: number) =>
  `${config.origin}/repository/${repositoryId}`;

// The envelope (see the header) with our extension attributes;
//
//   repositoryid  Integer  The repository the event happened in; the
//                          one `source` names, carried so a subscriber
//                          scopes delivery without parsing a URI.
//                          REQUIRED on every event.
//   actorid       Integer  The user who caused it. OPTIONAL: absent for
//                          system-initiated writes (imports,
//                          linked-content sync). An attribute rather
//                          than part of `data`, which describes the
//                          resource and not the person.
export interface CloudEvent<T = Record<string, unknown>> {
  specversion: typeof SPEC_VERSION;
  id: string;
  source: string;
  type: string;
  subject?: string;
  time: string;
  datacontenttype: 'application/json';
  data: T;
  repositoryid: number;
  actorid?: number;
}

const emitter = new EventEmitter();
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
 * Publishes a domain event.
 */
export function publish(input: PublishInput): CloudEvent | null {
  try {
    const event: CloudEvent = {
      specversion: SPEC_VERSION,
      id: cuid(),
      source: sourceOf(input.repositoryId),
      type: input.type,
      ...(input.subject && { subject: input.subject }),
      time: new Date().toISOString(),
      datacontenttype: 'application/json',
      data: input.data ?? {},
      repositoryid: input.repositoryId,
      ...(input.actorId && { actorid: input.actorId }),
    };
    logger.debug(
      { type: event.type, subject: event.subject },
      'Event published',
    );
    setImmediate(() => {
      try {
        emitter.emit(CHANNEL, event);
      } catch (err) {
        logger.warn({ err, type: event.type }, 'Event delivery failed');
      }
    });
    return event;
  } catch (err) {
    logger.warn({ err, type: input.type }, 'Event publish failed');
    return null;
  }
}
