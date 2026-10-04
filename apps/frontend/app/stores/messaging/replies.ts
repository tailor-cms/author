import type { Message } from '@tailor-cms/interfaces/comment';
import type { MessageCache } from './messageCache';

import { api } from '@/api';

export const createReplies = (messageCache: MessageCache) => {
  const replyIds = reactive(new Map<number, number[]>());
  const openReplyParentId = ref<number | null>(null);

  const replyParent = computed(() => messageCache.get(openReplyParentId.value));

  const replies = computed(() => {
    const parentId = openReplyParentId.value;
    return parentId ? messageCache.getMany(replyIds.get(parentId)) : [];
  });

  // Only a new reply raises the count; loaded ones are already counted
  function indexReply(message: Message, { isNew = false } = {}) {
    messageCache.setLocal(message);
    const { parentId } = message;
    if (!parentId) return;
    const ids = replyIds.get(parentId) ?? [];
    if (ids.includes(message.id)) return;
    replyIds.set(parentId, [...ids, message.id]);
    if (isNew) countReply(parentId, message);
  }

  // Updates the parent's "N replies" footer
  function countReply(parentId: number, reply: Message) {
    const parent = messageCache.get(parentId);
    if (!parent) return;
    const authors = new Set(parent.replyAuthorIds ?? []);
    if (reply.authorId) authors.add(reply.authorId);
    messageCache.setLocal({
      ...parent,
      replyCount: (parent.replyCount ?? 0) + 1,
      lastReplyAt: reply.createdAt,
      replyAuthorIds: [...authors],
    });
  }

  // Opens a message's replies
  async function openReplies(repositoryId: number, messageId: number) {
    openReplyParentId.value = messageId;
    const items = await api.messaging.getReplies({
      params: { repositoryId, messageId },
    });
    replyIds.set(messageId, []);
    (items as unknown as Message[]).forEach((it) => indexReply(it));
    return items;
  }

  function closeReplies() {
    openReplyParentId.value = null;
  }

  function clear() {
    replyIds.clear();
    openReplyParentId.value = null;
  }

  return {
    openReplyParentId,
    replyParent,
    replies,
    indexReply,
    openReplies,
    closeReplies,
    clear,
  };
};

export type Replies = ReturnType<typeof createReplies>;
