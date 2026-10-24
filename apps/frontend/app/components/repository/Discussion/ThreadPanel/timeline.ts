import type { Message } from '@tailor-cms/interfaces/comment';

import { compact } from 'lodash-es';
import { dayLabel } from '@tailor-cms/core-components';
import { isSameDay } from 'date-fns/isSameDay';

export type TimelineEntry =
  | { type: 'day'; key: string; label: string }
  | { type: 'unread'; key: string }
  | { type: 'message'; key: string; message: Message; isGrouped: boolean };

// A day's entries under its label, which stays pinned while they scroll by
export interface TimelineDay {
  key: string;
  label: string;
  entries: Exclude<TimelineEntry, { type: 'day' }>[];
}

interface TimelineSource {
  messages: Message[];
  // Where the reader left off, captured when the thread was opened
  lastReadAt?: string | null;
  currentUserId?: number | null;
}

// Messages from one sender within this window read as one block
const GROUP_WINDOW_MS = 5 * 60 * 1000;

// Integration posts have no author, so the integration and the name it
// posts under tell them apart
const senderOf = ({ integration, senderName, authorId }: Message) =>
  integration ? `${integration.id}:${senderName ?? ''}` : `${authorId}`;

export const isContinuation = (previous: Message, message: Message) =>
  senderOf(previous) === senderOf(message) &&
  Date.parse(message.createdAt) - Date.parse(previous.createdAt) <
    GROUP_WINDOW_MS;

const dayEntry = ({ createdAt }: Message): TimelineEntry => {
  const date = new Date(createdAt);
  const key = `day-${date.toDateString()}`;
  return { type: 'day', key, label: dayLabel(date) };
};

const unreadEntry = ({ uid }: Message): TimelineEntry => ({
  type: 'unread',
  key: `unread-${uid}`,
});

// The first message newer than where the reader left off.
const firstUnseenOf = (source: TimelineSource) => {
  const { messages, lastReadAt, currentUserId } = source;
  if (!lastReadAt) return undefined;
  const watermark = Date.parse(lastReadAt);
  return messages.find(
    (it) =>
      it.authorId !== currentUserId && Date.parse(it.createdAt) > watermark,
  );
};

/**
 * The timeline as rendered: a divider where a day starts, a marker
 * where the unread messages start, and each message flagged when it
 * continues the one before it.
 */
export const buildTimeline = (source: TimelineSource): TimelineEntry[] => {
  const { messages } = source;
  const firstUnseen = firstUnseenOf(source);
  return messages.flatMap((message, index) => {
    const previous = messages[index - 1];
    const isNewDay =
      !previous || !isSameDay(previous.createdAt, message.createdAt);
    const isFirstUnseen = message === firstUnseen;
    const isGrouped =
      !isNewDay && !isFirstUnseen && isContinuation(previous, message);
    return compact([
      isNewDay && dayEntry(message),
      isFirstUnseen && unreadEntry(message),
      { type: 'message', key: message.uid, message, isGrouped },
    ]);
  });
};

export const groupByDay = (entries: TimelineEntry[]): TimelineDay[] =>
  entries.reduce<TimelineDay[]>((days, entry) => {
    if (entry.type === 'day') days.push({ ...entry, entries: [] });
    else days.at(-1)?.entries.push(entry);
    return days;
  }, []);
