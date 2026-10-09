import type { Message, ThreadScope } from '@tailor-cms/interfaces/comment';
import type { ReaderThread } from '@tailor-cms/api-client';
import type { MessageCache } from './messageCache';
import type { Replies } from './replies';
import type { Unread } from './unread';

import { api } from '@/api';
import { useAuthStore } from '@/stores/auth';

type ReaderState = Pick<ReaderThread, 'isUnread' | 'isStarred' | 'lastReadAt'>;

export type Thread = Omit<ReaderThread, keyof ReaderState>;

const NO_READER_STATE: ReaderState = {
  isUnread: false,
  isStarred: false,
  lastReadAt: null,
};

const byRecency = (a: ReaderThread, b: ReaderThread) => {
  const left = a.lastMessageAt ? Date.parse(a.lastMessageAt) : 0;
  const right = b.lastMessageAt ? Date.parse(b.lastMessageAt) : 0;
  return right - left;
};

export const createThreads = (
  messageCache: MessageCache,
  replies: Replies,
  unread: Unread,
) => {
  const authStore = useAuthStore();

  const threads = reactive(new Map<number, ReaderThread>());
  const messageIds = reactive(new Map<number, number[]>());
  const selectedThreadId = ref<number | null>(null);
  // The caller's read watermark at the moment a thread was opened
  const openedWatermark = ref<string | null>(null);
  const isLoading = ref(false);
  const total = ref(0);

  const items = computed(() => Array.from(threads.values()).sort(byRecency));

  const selectedThread = computed(() =>
    selectedThreadId.value ? threads.get(selectedThreadId.value) : null,
  );

  const selectedThreadMessages = computed(() => {
    const threadId = selectedThreadId.value;
    return threadId ? messageCache.getMany(messageIds.get(threadId)) : [];
  });

  const hasLoadedMessages = (threadId?: number | null) =>
    !!threadId && messageIds.has(threadId);

  function addThread(thread: Thread | ReaderThread) {
    const existing = threads.get(thread.id);
    threads.set(thread.id, { ...NO_READER_STATE, ...existing, ...thread });
    return threads.get(thread.id) as ReaderThread;
  }

  function dropThread(threadId: number) {
    threads.delete(threadId);
    messageIds.delete(threadId);
    if (selectedThreadId.value === threadId) selectedThreadId.value = null;
  }

  function addToThread(message: Message, { isNew = false } = {}) {
    if (message.parentId) {
      replies.indexReply(message, { isNew });
      if (!message.isBroadcast) return;
    }
    messageCache.setLocal(message);
    const { threadId } = message;
    if (!threadId) return;
    const ids = messageIds.get(threadId) ?? [];
    if (ids.includes(message.id)) return;
    messageIds.set(threadId, [...ids, message.id]);
  }

  function updateThreadSummary(message: Message) {
    const { threadId } = message;
    const thread = threadId ? threads.get(threadId) : null;
    if (!thread) return;
    const me = authStore.user?.id ?? null;
    const isMine = message.authorId === me || message.actorId === me;
    addThread({
      ...thread,
      lastMessageAt: message.createdAt,
      messageCount: thread.messageCount + 1,
      isUnread: !isMine && threadId !== selectedThreadId.value,
    });
  }

  async function fetchThreads(
    repositoryId: number,
    params: { scope?: ThreadScope; type?: string; name?: string } = {},
  ) {
    isLoading.value = true;
    try {
      const { items: fetched, total: fetchedTotal } =
        await api.messaging.getThreads({
          params: { repositoryId },
          query: params as any,
        });
      threads.clear();
      fetched.forEach(addThread);
      total.value = fetchedTotal;
      return items.value;
    } finally {
      isLoading.value = false;
    }
  }

  async function selectThread(repositoryId: number, threadId: number) {
    selectedThreadId.value = threadId;
    if (!threads.has(threadId)) {
      const thread = await api.messaging.getThread({
        params: { repositoryId, threadId },
      });
      addThread(thread);
    }
    openedWatermark.value = threads.get(threadId)?.lastReadAt ?? null;
    const items = await api.messaging.getMessages({
      params: { repositoryId, threadId },
    });
    messageIds.set(threadId, []);
    (items as unknown as Message[]).forEach((it) => addToThread(it));
    await markRead(repositoryId, threadId);
    return items;
  }

  function deselectThread() {
    selectedThreadId.value = null;
  }

  async function startThread(
    repositoryId: number,
    payload: { content: string; title: string },
  ) {
    const thread = await api.messaging.createThread({
      params: { repositoryId },
      body: payload,
    });
    addThread(thread);
    return thread;
  }

  async function postMessage(
    repositoryId: number,
    threadId: number,
    content: string,
  ) {
    const thread = threads.get(threadId);
    const message = await messageCache.save({
      repositoryId,
      threadId,
      content,
      // Anchored threads
      activityId: thread?.activityId ?? undefined,
      contentElementId: thread?.contentElementId ?? undefined,
    });
    addToThread(message);
    updateThreadSummary(message);
    return message;
  }

  async function postReply(
    repositoryId: number,
    parentId: number,
    content: string,
    isBroadcast = false,
  ) {
    const message = await messageCache.save({
      repositoryId,
      parentId,
      content,
      isBroadcast,
      threadId: selectedThreadId.value ?? undefined,
    });
    addToThread(message, { isNew: true });
    return message;
  }

  async function setResolved(
    repositoryId: number,
    threadId: number,
    resolved: boolean,
  ) {
    const thread = await api.messaging.resolveThread({
      params: { repositoryId, threadId },
      body: { resolved },
    });
    return addThread(thread);
  }

  async function setStarred(
    repositoryId: number,
    threadId: number,
    isStarred: boolean,
  ) {
    const thread = await api.messaging.setStarred({
      params: { repositoryId, threadId },
      body: { isStarred },
    });
    return addThread(thread);
  }

  // What a channel thread can be subscribed to: built-in events plus the
  // repository's integrations
  function fetchSubscriptionTopics(repositoryId: number) {
    return api.messaging.getTopics({ params: { repositoryId } });
  }

  async function setSubscriptions(
    repositoryId: number,
    threadId: number,
    topics: string[],
  ) {
    await api.messaging.setSubscriptions({
      params: { repositoryId, threadId },
      body: { topics },
    });
    const thread = threads.get(threadId);
    if (thread) thread.subscriptions = topics;
  }

  /**
   * Assets shared in the discussion, newest first.
   */
  function listAssets(repositoryId: number, threadId?: number) {
    return api.messaging.getAssets({
      params: { repositoryId },
      query: { threadId } as any,
    });
  }

  async function removeThread(repositoryId: number, threadId: number) {
    await api.messaging.deleteThread({ params: { repositoryId, threadId } });
    dropThread(threadId);
  }

  async function markRead(repositoryId: number, threadId: number) {
    const thread = threads.get(threadId);
    if (thread) thread.isUnread = false;
    return unread.markThreadRead(repositoryId, threadId);
  }

  async function markAllRead(repositoryId: number) {
    const counts = await unread.markAllRead(repositoryId);
    threads.forEach((it) => (it.isUnread = false));
    return counts;
  }

  function clear() {
    threads.clear();
    messageIds.clear();
    selectedThreadId.value = null;
    openedWatermark.value = null;
    total.value = 0;
  }

  return {
    threads,
    items,
    selectedThread,
    selectedThreadId,
    openedWatermark,
    selectedThreadMessages,
    isLoading,
    total,
    hasLoadedMessages,
    addThread,
    dropThread,
    addToThread,
    updateThreadSummary,
    fetchThreads,
    selectThread,
    deselectThread,
    startThread,
    postMessage,
    postReply,
    setResolved,
    setStarred,
    fetchSubscriptionTopics,
    setSubscriptions,
    listAssets,
    removeThread,
    markRead,
    markAllRead,
    clear,
  };
};
