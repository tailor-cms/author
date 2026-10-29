import { omit } from 'lodash-es';
import type { MaybeRefOrGetter } from 'vue';
import { useMessagingStore } from '@/stores/messaging';

/**
 * Keeps the open thread in the URL (`?threadId=`), so a thread can be
 * linked, reloaded, and stepped through with back and forward. A thread
 * opened at a message keeps it too (`&messageId=`).
 */
export const useThreadRoute = (repositoryId: MaybeRefOrGetter<number>) => {
  const route = useRoute();
  const router = useRouter();

  const notify = useNotification();
  const messagingStore = useMessagingStore();

  const routeThreadId = computed(() => Number(route.query.threadId) || null);
  const routeMessageId = computed(() => Number(route.query.messageId) || null);

  const toQuery = (threadId: number | null, messageId?: number) => {
    const query = omit(route.query, 'threadId', 'messageId');
    if (!threadId) return query;
    if (messageId) query.messageId = String(messageId);
    return { ...query, threadId: String(threadId) };
  };

  const openThread = (threadId: number | null, messageId?: number) =>
    router.push({ query: toQuery(threadId, messageId) });

  const replaceThread = (threadId: number | null) =>
    router.replace({ query: toQuery(threadId) });

  // Reloads the thread kept from a previous visit too, so its "New"
  // marker starts where that visit left off; opened at a message, back
  // to that message
  const select = async (threadId: number | null, messageId: number | null) => {
    if (!threadId) return messagingStore.deselectThread();
    try {
      await messagingStore.selectThread(
        toValue(repositoryId),
        threadId,
        messageId,
      );
    } catch {
      notify('That thread is no longer available', { color: 'error' });
      replaceThread(null);
    }
  };

  // Back to the newest messages: dropping the message from the URL loads
  // them, or with none there, the same URL would not, so they load here
  const openLatest = (threadId: number | null) => {
    if (routeMessageId.value) return openThread(threadId);
    return select(threadId, null);
  };

  watch([routeThreadId, routeMessageId], ([threadId, messageId]) =>
    select(threadId, messageId),
  );
  onBeforeUnmount(() => messagingStore.leaveThread());

  // Arriving without a thread in the URL reopens the last one viewed
  if (routeThreadId.value) select(routeThreadId.value, routeMessageId.value);
  else if (messagingStore.selectedThreadId) {
    replaceThread(messagingStore.selectedThreadId);
  }

  return {
    routeThreadId,
    routeMessageId,
    openThread,
    openLatest,
    closeThread: () => replaceThread(null),
  };
};
