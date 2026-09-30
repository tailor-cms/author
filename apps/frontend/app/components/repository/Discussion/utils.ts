import type { Message } from '@tailor-cms/interfaces/comment';

import { ThreadType } from '@tailor-cms/interfaces/comment';

type Sender = Pick<Message, 'author' | 'senderName' | 'integration'>;

export const senderName = ({ author, senderName, integration }: Sender) =>
  author?.label ?? senderName ?? integration?.name ?? 'Unknown';

export const isChannelThread = (thread: { type: ThreadType }) =>
  thread.type === ThreadType.Repository;

/**
 * The reader's own most recent message in a list, if they have one.
 */
export const lastOwnMessage = (
  messages: Message[],
  currentUserId?: number | null,
): Message | undefined => {
  if (!currentUserId) return undefined;
  return messages
    .filter((it) => it.authorId === currentUserId && !it.deletedAt)
    .at(-1);
};
