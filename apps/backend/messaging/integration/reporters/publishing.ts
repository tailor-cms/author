import type { ActivityData, Reporter } from './lib/types.ts';
import { formatAnnouncement, formatItemList, summarize } from './lib/format.ts';
import { EventType } from '#shared/events/bus.ts';

const publishing: Reporter<ActivityData> = {
  key: 'publishing',
  name: 'Publishing',
  icon: 'mdi-cloud-upload-outline',
  events: [EventType.ActivityPublished],
  // A publish of entire repository is one request per activity with
  // no completion signal, so this is a aprox at how long a run takes.
  windowMs: 10000,
  format: (events, ctx) =>
    formatAnnouncement(summarize('Published', events), {
      color: 'success',
      title: 'Published',
      text: formatItemList(events),
      fields: {
        'Items': events.length > 1 ? events.length : null,
        'Published by': ctx.actorLabel,
      },
    }),
};

export default publishing;
