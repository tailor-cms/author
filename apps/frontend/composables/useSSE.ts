import feed from '@/lib/RepositoryFeed';
import { useActivityStore } from '@/stores/activity';
import { useContentElementStore } from '@/stores/content-elements';
import { useCommentStore } from '@/stores/comments';

export const useSSE = () => {
  const sseId = ref();
  const repositoryId = ref();
  const activityStore = useActivityStore();
  const contentElementStore = useContentElementStore();
  const commentStore = useCommentStore();

  function connect(id: number) {
    feed.connect(id, (conn: any) => {
      sseId.value = conn.id;
      repositoryId.value = id;
      activityStore.$plugSSE();
      contentElementStore.$plugSSE();
      commentStore.$plugSSE();
    });
  }

  function disconnect() {
    feed.disconnect();
    sseId.value = null;
    repositoryId.value = null;
  }

  return {
    sseId,
    repositoryId,
    connect,
    disconnect,
  };
};
