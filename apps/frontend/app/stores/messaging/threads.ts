import type { Message, ThreadScope } from '@tailor-cms/interfaces/comment';
import type { ReaderThread } from '@tailor-cms/api-client';
import type { MessageCache } from './messageCache';
import type { Replies } from './replies';
import type { Unread } from './unread';

import { compact, debounce, map } from 'lodash-es';
import { createMessagePages, PAGE_SIZE, type PageQuery } from './pages';
import { api } from '@/api';
import { useAuthStore } from '@/stores/auth';

type ThreadParams = { scope?: ThreadScope; type?: string; name?: string };
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

  // Every thread loaded, whether or not the list shows it
  const threads = reactive(new Map<number, ReaderThread>());
  // The list as filtered: what the last fetch returned, plus new threads
  const listedIds = ref<number[]>([]);
  // Filters of the last fetch
  const listParams = ref<ThreadParams>({});
  const messageIds = reactive(new Map<number, number[]>());
  const pages = createMessagePages(messageCache);
  const selectedThreadId = ref<number | null>(null);
  // The thread last asked for, which may still be loading
  let requestedThreadId: number | null = null;
  // Whether the selected thread is on screen, not just kept for return
  const isInView = ref(false);
  // The caller's read watermark at the moment a thread was opened
  const openedWatermark = ref<string | null>(null);
  const isLoading = ref(false);
  const total = ref(0);

  const items = computed(() =>
    compact(listedIds.value.map((id) => threads.get(id))).sort(byRecency),
  );

  const selectedThread = computed(() =>
    selectedThreadId.value ? threads.get(selectedThreadId.value) : null,
  );

  const selectedThreadMessages = computed(() => {
    const threadId = selectedThreadId.value;
    return threadId ? messageCache.getMany(messageIds.get(threadId)) : [];
  });

  const messagesPaging = computed(() => pages.paging(selectedThreadId.value));

  const isListFiltered = computed(() => {
    const { scope, type, name } = listParams.value;
    return (!!scope && scope !== 'all') || !!type || !!name?.trim();
  });

  const hasLoadedMessages = (threadId?: number | null) =>
    !!threadId && messageIds.has(threadId);

  const isViewingThread = (threadId?: number | null) =>
    isInView.value && !!threadId && threadId === selectedThreadId.value;

  function addThread(thread: Thread | ReaderThread) {
    const existing = threads.get(thread.id);
    threads.set(thread.id, { ...NO_READER_STATE, ...existing, ...thread });
    return threads.get(thread.id) as ReaderThread;
  }

  // A thread created elsewhere shows up live, unless the list is filtered;
  // a filtered list picks it up on its next fetch
  function listThread(thread: Thread | ReaderThread) {
    const added = addThread(thread);
    if (isListFiltered.value || listedIds.value.includes(thread.id)) {
      return added;
    }
    listedIds.value.push(thread.id);
    return added;
  }

  function dropThread(threadId: number) {
    threads.delete(threadId);
    listedIds.value = listedIds.value.filter((id) => id !== threadId);
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
    // Opened at an older stretch, it comes in with the newest messages
    if (isNew && pages.hasNewer(threadId)) return;
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
      isUnread: !isMine && !isViewingThread(threadId),
    });
  }

  async function fetchAll(repositoryId: number, params: ThreadParams) {
    const all: ReaderThread[] = [];
    let page;
    do {
      page = await api.messaging.getThreads({
        params: { repositoryId },
        query: { ...params, limit: 100, offset: all.length } as any,
      });
      all.push(...page.items);
    } while (page.items.length && all.length < page.total);
    return all;
  }

  async function fetchThreads(
    repositoryId: number,
    params: ThreadParams = {},
  ) {
    isLoading.value = true;
    try {
      const fetched = await fetchAll(repositoryId, params);
      fetched.forEach(addThread);
      listedIds.value = map(fetched, 'id');
      listParams.value = params;
      total.value = fetched.length;
      return items.value;
    } finally {
      isLoading.value = false;
    }
  }

  const fetchMessages =
    (repositoryId: number, threadId: number) => (query: PageQuery = {}) =>
      api.messaging.getMessages({
        params: { repositoryId, threadId },
        query: { ...query, limit: PAGE_SIZE },
      });

  // Puts a thread on screen, with where its "New" marker starts
  function showThread(threadId: number, watermark: string | null) {
    selectedThreadId.value = threadId;
    openedWatermark.value = watermark;
  }

  // Shows the thread with its messages, never empty in between: one seen
  // before switches at once and refreshes, a new one once they arrive.
  // Opened at a message, it loads back to it
  async function selectThread(
    repositoryId: number,
    threadId: number,
    messageId: number | null = null,
  ) {
    requestedThreadId = threadId;
    isInView.value = true;
    if (!threads.has(threadId)) {
      const thread = await api.messaging.getThread({
        params: { repositoryId, threadId },
      });
      addThread(thread);
    }
    // Only unread threads get a "New" marker; live arrivals never do.
    // Never read means everything is new, as the server counts it
    const thread = threads.get(threadId);
    const watermark = thread?.isUnread
      ? (thread.lastReadAt ?? new Date(0).toISOString())
      : null;
    pages.trimToLatest(messageIds, threadId);
    if (hasLoadedMessages(threadId)) showThread(threadId, watermark);
    const fetchPage = fetchMessages(repositoryId, threadId);
    const items = await pages.fetchLatest(threadId, fetchPage, messageId);
    // Another thread was picked meanwhile
    if (requestedThreadId !== threadId) return items;
    messageIds.set(threadId, []);
    items.forEach((it) => addToThread(it));
    if (selectedThreadId.value !== threadId) showThread(threadId, watermark);
    await markRead(repositoryId, threadId);
    return items;
  }

  function loadOlderMessages(repositoryId: number) {
    const threadId = selectedThreadId.value;
    if (!threadId) return;
    const fetchPage = fetchMessages(repositoryId, threadId);
    return pages.loadOlder(messageIds, threadId, fetchPage);
  }

  function loadNewerMessages(repositoryId: number) {
    const threadId = selectedThreadId.value;
    if (!threadId) return;
    const fetchPage = fetchMessages(repositoryId, threadId);
    return pages.loadNewer(messageIds, threadId, fetchPage);
  }

  function deselectThread() {
    requestedThreadId = null;
    selectedThreadId.value = null;
  }

  // Off the discussion page; the thread stays selected for return
  function leaveThread() {
    isInView.value = false;
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
    // Sent from an older stretch, the thread moves to the newest first
    if (pages.hasNewer(threadId)) await selectThread(repositoryId, threadId);
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
    // Replying is reading: the "New" marker has served its purpose
    if (threadId === selectedThreadId.value) openedWatermark.value = null;
    return message;
  }

  async function postReply(
    repositoryId: number,
    parentId: number,
    content: string,
    isBroadcast = false,
  ) {
    if (replies.hasNewerReplies(parentId)) {
      await replies.openReplies(repositoryId, parentId);
    }
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
    const { lastReadAt } = await unread.markThreadRead(repositoryId, threadId);
    // Re-read, as the entry may have been replaced while awaiting
    const current = threads.get(threadId);
    if (current) current.lastReadAt = lastReadAt;
  }

  // Messages landing in the thread on screen are read as they arrive
  const keepRead = debounce((repositoryId: number) => {
    const threadId = selectedThreadId.value;
    if (!isViewingThread(threadId)) return;
    markRead(repositoryId, threadId!).catch(() => undefined);
  }, 800);

  async function markAllRead(repositoryId: number) {
    const counts = await unread.markAllRead(repositoryId);
    threads.forEach((it) => (it.isUnread = false));
    return counts;
  }

  function clear() {
    threads.clear();
    listedIds.value = [];
    listParams.value = {};
    messageIds.clear();
    pages.clear();
    selectedThreadId.value = null;
    requestedThreadId = null;
    isInView.value = false;
    openedWatermark.value = null;
    total.value = 0;
    keepRead.cancel();
  }

  return {
    threads,
    items,
    selectedThread,
    selectedThreadId,
    openedWatermark,
    selectedThreadMessages,
    messagesPaging,
    isLoading,
    total,
    hasLoadedMessages,
    isViewingThread,
    addThread,
    listThread,
    dropThread,
    addToThread,
    updateThreadSummary,
    fetchThreads,
    selectThread,
    loadOlderMessages,
    loadNewerMessages,
    deselectThread,
    leaveThread,
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
    keepRead,
    markAllRead,
    clear,
  };
};
