import type { Message } from '@tailor-cms/interfaces/comment';
import { maxBy } from 'lodash-es';

type OwnedMessage = Pick<Message, 'authorId' | 'createdAt' | 'deletedAt'>;

// The reader's latest message in a list; what the up
// arrow in an empty composer opens for editing
export const lastOwnMessage = <T extends OwnedMessage>(
  messages: T[],
  currentUserId?: number | null,
): T | undefined => {
  if (!currentUserId) return undefined;
  const own = messages.filter(
    (it) => it.authorId === currentUserId && !it.deletedAt,
  );
  return maxBy(own, (it) => Date.parse(it.createdAt));
};
