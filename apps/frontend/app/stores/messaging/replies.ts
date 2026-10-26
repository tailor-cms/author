import type { Message } from '@tailor-cms/interfaces/comment';
import type { MessageCache } from './messageCache';

import { createMessagePages, PAGE_SIZE } from './pages';
import { api } from '@/api';

export const createReplies = (messageCache: MessageCache) => {
  const replyIds = reactive(new Map<number, number[]>());
  const pages = createMessagePages(messageCache);
  const openReplyParentId = ref<number | null>(null);
  // A reply to open at and highlight, e.g. from a search result
  const focusedReplyId = ref<number | null>(null);

  const replyParent = computed(() => messageCache.get(openReplyParentId.value));

  const replies = computed(() => {
    const parentId = openReplyParentId.value;
    return parentId ? messageCache.getMany(replyIds.get(parentId)) : [];
  });

  // Opened for the first time, its replies still on the way
  const isLoadingReplies = computed(() => {
    const parentId = openReplyParentId.value;
    return !!parentId && !replyIds.has(parentId);
  });

  const replyPagingStatus = computed(() =>
    pages.status(openReplyParentId.value),
  );

  const fetchReplies =
    (repositoryId: number, parentId: number) => (before?: number) =>
      api.messaging.getReplies({
        params: { repositoryId, messageId: parentId },
        query: { before, limit: PAGE_SIZE },
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

  // Opens a message's replies, at their latest or at the given reply
  async function openReplies(
    repositoryId: number,
    parentId: number,
    replyId: number | null = null,
  ) {
    pages.trimToLatest(replyIds, parentId);
    openReplyParentId.value = parentId;
    focusedReplyId.value = replyId;
    const fetchPage = fetchReplies(repositoryId, parentId);
    const items = await pages.fetchLatest(parentId, fetchPage);
    replyIds.set(parentId, []);
    items.forEach((it) => indexReply(it));
    return items;
  }

  function loadOlderReplies(repositoryId: number) {
    const parentId = openReplyParentId.value;
    if (!parentId) return;
    const fetchPage = fetchReplies(repositoryId, parentId);
    return pages.loadOlder(replyIds, parentId, fetchPage);
  }

  function closeReplies() {
    openReplyParentId.value = null;
  }

  function clear() {
    replyIds.clear();
    pages.clear();
    openReplyParentId.value = null;
    focusedReplyId.value = null;
  }

  return {
    openReplyParentId,
    focusedReplyId,
    replyParent,
    replies,
    isLoadingReplies,
    replyPagingStatus,
    indexReply,
    openReplies,
    loadOlderReplies,
    closeReplies,
    clear,
  };
};

export type Replies = ReturnType<typeof createReplies>;
