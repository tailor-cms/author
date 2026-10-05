import type { Message } from '@tailor-cms/interfaces/comment';

import { compact } from 'lodash-es';
import { formatDate } from 'date-fns/format';
import { isSameDay } from 'date-fns/isSameDay';
import { isThisYear } from 'date-fns/isThisYear';
import { isToday } from 'date-fns/isToday';
import { isYesterday } from 'date-fns/isYesterday';

export type TimelineEntry =
  | { type: 'day'; key: string; label: string }
  | { type: 'unread'; key: string }
  | { type: 'message'; key: string; message: Message; isGrouped: boolean };

interface TimelineSource {
  messages: Message[];
  // Where the reader left off, captured when the thread was opened
  lastReadAt?: string | null;
  currentUserId?: number | null;
}

// Messages from one sender within this window read as one block
const GROUP_WINDOW_MS = 5 * 60 * 1000;

const dayLabel = (date: Date) => {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return formatDate(date, isThisYear(date) ? 'd MMMM' : 'd MMMM yyyy');
};

// Integration posts have no author, so the integration and the name it
// posts under tell them apart
const senderOf = ({ integration, senderName, authorId }: Message) =>
  integration ? `${integration.id}:${senderName ?? ''}` : `${authorId}`;

const isContinuation = (previous: Message, message: Message) =>
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
 * The timeline as rendered: a divider per day/
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
