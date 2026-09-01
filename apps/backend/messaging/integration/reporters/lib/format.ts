import type {
  ActivityData,
  Announcement,
  Attachment,
  AttachmentField,
  AttachmentSpec,
  FieldValue,
} from './types.ts';
import type { CloudEvent } from '#shared/events/bus.ts';
import { formatReference } from '@tailor-cms/utils';
import omitBy from 'lodash/omitBy.js';

/**
 * The activity as a reference token: `<#activity:7|Intro>`. Falls back
 * to its plain name, then to `an item`.
 */
export const activityRef = (data: ActivityData) =>
  data.activityId
    ? formatReference('activity', data.activityId, data.name ?? 'activity')
    : (data.name ?? 'an item');

/** The same for a file: `<#asset:5|logo.png>`, its name, then `a file`. */
export const assetRef = (asset?: { id?: number; name?: string }) =>
  asset?.id
    ? formatReference('asset', asset.id, asset.name ?? 'file')
    : (asset?.name ?? 'a file');

/** "Added <link>" for one, "Added 12 items" for a burst. */
export const summarize = (verb: string, events: CloudEvent<ActivityData>[]) =>
  events.length === 1
    ? `${verb} ${activityRef(events[0].data)}`
    : `${verb} ${events.length} items`;

/**
 * The items one per line: `Page · <#activity:7|Intro>`. Past `limit`,
 * the remainder becomes a closing `and 4 more`.
 */
export const formatItemList = (
  events: CloudEvent<ActivityData>[],
  limit = 8,
) => {
  const lines = events.slice(0, limit).map(({ data }) => {
    const ref = activityRef(data);
    return data.typeLabel ? `${data.typeLabel} · ${ref}` : ref;
  });
  const rest = events.length - lines.length;
  if (rest > 0) lines.push(`and ${rest} more`);
  return lines.join('\n');
};

/**
 * The one value a whole window agrees on, or null when it holds more
 * than one.
 */
export const sharedValue = <T>(values: T[]): T | null => {
  const [value, ...rest] = new Set(values);
  return rest.length ? null : (value ?? null);
};

const isSet = (value: FieldValue) =>
  value != null && value !== false && value !== '';

// The label/value rows at the foot of an attachment - `Published by | Ada`.
// One with no value is left out rather than drawn blank.
const toFields = (entries: Record<string, FieldValue>): AttachmentField[] =>
  Object.entries(entries)
    .filter(([, value]) => isSet(value))
    .map(([title, value]) => ({ title, value: String(value), short: true }));

// Attachment slots with nothing in them are left out, so the stored
// message carries only what a client will draw.
const omitEmptySlots = (attachment: Attachment) =>
  omitBy(attachment, (value) =>
    Array.isArray(value) ? !value.length : !isSet(value),
  ) as Attachment;

/** Pairs the plain line with its attachment, ready to store. */
export const formatAnnouncement = (
  content: string,
  { fields, ...attachment }: AttachmentSpec,
): Announcement => ({
  content,
  attachments: [
    omitEmptySlots({ ...attachment, fields: toFields(fields ?? {}) }),
  ],
});
