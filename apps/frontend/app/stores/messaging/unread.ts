import { debounce } from 'lodash-es';
import { api } from '@/api';

// The reader's unread threads and mentions
export const createUnread = () => {
  const counts = ref({ threads: 0, mentions: 0 });

  async function fetchUnread(repositoryId: number) {
    counts.value = await api.messaging.getUnread({ params: { repositoryId } });
    return counts.value;
  }

  const refreshUnread = debounce((repositoryId: number) => {
    fetchUnread(repositoryId).catch(() => undefined);
  }, 800);

  async function markThreadRead(repositoryId: number, threadId: number) {
    await api.messaging.markThreadRead({ params: { repositoryId, threadId } });
    return fetchUnread(repositoryId);
  }

  async function markAllRead(repositoryId: number) {
    counts.value = await api.messaging.markAllRead({
      params: { repositoryId },
    });
    return counts.value;
  }

  function clear() {
    counts.value = { threads: 0, mentions: 0 };
  }

  return {
    counts,
    fetchUnread,
    refreshUnread,
    markThreadRead,
    markAllRead,
    clear,
  };
};

export type Unread = ReturnType<typeof createUnread>;
