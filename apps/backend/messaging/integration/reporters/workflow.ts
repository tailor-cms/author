import type { ActivityData, Reporter } from './lib/types.ts';
import type { CloudEvent } from '#shared/events/bus.ts';
import { activityRef, formatAnnouncement, formatItemList } from './lib/format.ts';
import { EventType } from '#shared/events/bus.ts';

interface StatusData extends ActivityData {
  statusLabel: string;
  statusColor: string | null;
  previousStatusLabel: string;
}

const transition = ({ data }: CloudEvent<StatusData>) =>
  `${activityRef(data)} → ${data.statusLabel}`;

const workflow: Reporter<StatusData> = {
  key: 'workflow',
  name: 'Workflow',
  icon: 'mdi-progress-check',
  events: [EventType.ActivityStatusChanged],
  format(events, ctx) {
    const { statusLabel, statusColor, previousStatusLabel } = events[0].data;
    const color = statusColor ?? 'info';
    const by = { 'Moved by': ctx.actorLabel };
    if (events.length > 1) {
      return formatAnnouncement(`Moved ${events.length} items`, {
        color,
        title: `${events.length} items moved`,
        text: events.map(transition).join('\n'),
        fields: by,
      });
    }
    const item = activityRef(events[0].data);
    return formatAnnouncement(`Moved ${item} to ${statusLabel}`, {
      color,
      title: `${previousStatusLabel} → ${statusLabel}`,
      text: formatItemList(events),
      fields: by,
    });
  },
};

export default workflow;
