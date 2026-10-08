import type { Message } from '@tailor-cms/interfaces/comment';

import { ThreadType } from '@tailor-cms/interfaces/comment';

type Sender = Pick<Message, 'author' | 'senderName' | 'integration'>;

export const senderName = ({ author, senderName, integration }: Sender) =>
  author?.label ?? senderName ?? integration?.name ?? 'Unknown';

export const isChannelThread = (thread: { type: ThreadType }) =>
  thread.type === ThreadType.Repository;
