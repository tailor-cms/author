import type { AnyReporter, WindowContext } from './lib/types.ts';
import * as commentService from '../../comment.service.ts';
import * as integrationService from '../integration.service.ts';
import { subscribe, type CloudEvent } from '#shared/events/bus.ts';
import { subscribedThreads } from '../../thread/subscription.service.ts';
import { createLogger } from '#logger';
import { sharedValue } from './lib/format.ts';
import User from '#app/user/models/user.model.js';

const logger = createLogger('integration:reporters');

// The events collected so far, per open window.
const PENDING_EVENTS = new Map<string, CloudEvent[]>();
const DEFAULT_WINDOW_MS = 2500;

// A window is per repository, per reporter, per topic.
const windowKey = (reporter: AnyReporter, event: CloudEvent) =>
  `${event.repositoryid}:${reporter.key}:${event.type}`;

async function loadAuthorContext(actorId: number | null): Promise<WindowContext> {
  if (!actorId) return { actorLabel: null };
  const actor = await User.findByPk(actorId);
  return { actorLabel: actor?.label ?? null };
}

async function deliver(reporter: AnyReporter, events: CloudEvent[]) {
  const { repositoryid: repositoryId, type } = events[0];
  // Check subscribed threads for this repository and event type.
  const threads = await subscribedThreads(repositoryId, type);
  if (!threads.length) return;
  // N people in one window is no one person's doing: naming one would
  // misplace the byline and suppress their unread badge.
  const actorId = sharedValue(events.map((it) => it.actorid ?? null));
  const ctx = await loadAuthorContext(actorId);
  const announcement = reporter.format(events, ctx);
  if (!announcement?.content) return;
  const integration = await integrationService.registerBuiltin({
    key: reporter.key,
    name: reporter.name,
    icon: reporter.icon,
  });
  await Promise.all(
    threads.map((thread: any) =>
      commentService.createIntegrationMessage({
        repositoryId,
        threadId: thread.id,
        integrationId: integration.id,
        content: announcement.content,
        attachments: announcement.attachments ?? null,
        actorId,
      }),
    ),
  );
}

function collect(reporter: AnyReporter, event: CloudEvent) {
  const key = windowKey(reporter, event);
  const open = PENDING_EVENTS.get(key);
  if (open) {
    open.push(event);
    return;
  }
  PENDING_EVENTS.set(key, [event]);
  const timer = setTimeout(
    () => flush(key, reporter),
    reporter.windowMs ?? DEFAULT_WINDOW_MS,
  );
  // A window still waiting to close must not delay shutdown
  timer.unref?.();
}

// Closes the window and announces what it collected.
async function flush(key: string, reporter: AnyReporter) {
  const events = PENDING_EVENTS.get(key);
  PENDING_EVENTS.delete(key);
  if (!events) return;
  try {
    await deliver(reporter, events);
  } catch (err) {
    logger.warn(
      { err, reporter: reporter.key, count: events.length },
      'Reporter failed',
    );
  }
}

// Subscribes the reporters to the bus
export function listen(reporters: AnyReporter[]) {
  const byEvent = new Map<string, AnyReporter[]>();
  for (const reporter of reporters) {
    for (const type of reporter.events) {
      byEvent.set(type, [...(byEvent.get(type) ?? []), reporter]);
    }
  }
  subscribe((event) => {
    byEvent.get(event.type)?.forEach((reporter) => collect(reporter, event));
  });
  logger.info(
    { reporters: reporters.map((it) => it.key) },
    'Reporters listening',
  );
}
