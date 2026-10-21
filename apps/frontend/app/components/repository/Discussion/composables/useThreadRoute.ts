import { omit } from 'lodash-es';
import type { MaybeRefOrGetter } from 'vue';
import { useMessagingStore } from '@/stores/messaging';

/**
 * Keeps the open thread in the URL (`?threadId=`), so a thread can be
 * linked, reloaded, and stepped through with back and forward.
 */
export const useThreadRoute = (repositoryId: MaybeRefOrGetter<number>) => {
  const route = useRoute();
  const router = useRouter();

  const notify = useNotification();
  const messagingStore = useMessagingStore();

  const routeThreadId = computed(() => Number(route.query.threadId) || null);

  const toQuery = (threadId: number | null) =>
    threadId
      ? { ...route.query, threadId: String(threadId) }
      : omit(route.query, 'threadId');

  const openThread = (threadId: number | null) =>
    router.push({ query: toQuery(threadId) });

  const replaceThread = (threadId: number | null) =>
    router.replace({ query: toQuery(threadId) });

  const select = async (threadId: number | null) => {
    if (threadId === messagingStore.selectedThreadId) return;
    if (!threadId) return messagingStore.deselectThread();
    try {
      await messagingStore.selectThread(toValue(repositoryId), threadId);
    } catch {
      notify('That thread is no longer available', { color: 'error' });
      replaceThread(null);
    }
  };

  watch(routeThreadId, select);

  // Arriving without a thread in the URL reopens the last one viewed
  if (routeThreadId.value) select(routeThreadId.value);
  else if (messagingStore.selectedThreadId) {
    replaceThread(messagingStore.selectedThreadId);
  }

  return { openThread, closeThread: () => replaceThread(null) };
};
