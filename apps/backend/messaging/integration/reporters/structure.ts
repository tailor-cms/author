import type { ActivityData, Reporter } from './lib/types.ts';
import { formatAnnouncement, formatItemList, summarize } from './lib/format.ts';
import { EventType } from '#shared/events/bus.ts';

const structure: Reporter<ActivityData> = {
  key: 'structure',
  name: 'Structure',
  icon: 'mdi-file-tree',
  events: [EventType.ActivityCreated, EventType.ActivityRemoved],
  format(events, ctx) {
    const isAdded = events[0].type === EventType.ActivityCreated;
    const verb = isAdded ? 'Added' : 'Removed';
    return formatAnnouncement(summarize(verb, events), {
      color: isAdded ? 'info' : 'error',
      title: isAdded ? 'Added to the structure' : 'Removed from the structure',
      text: formatItemList(events),
      fields: {
        Items: events.length > 1 ? events.length : null,
        [`${verb} by`]: ctx.actorLabel,
      },
    });
  },
};

export default structure;
