import isEqual from 'lodash/isEqual';

import feed from '@/lib/RepositoryFeed';
import { useActivityStore } from '@/stores/activity';
import { useCommentStore } from '@/stores/comments';
import { useContentElementStore } from '@/stores/content-elements';

// Report user activity every 30s
const PING_INTERVAL = 30000;

// Subscribe to server-sent events on the repository level
export const useRepositorySSE = () => {
  // Connection ID for the server-sent events
  const sseId = ref<null | string>(null);
  // Timer for pinging the server and reporting user activity
  const heartbeat = ref();

  const route = useRoute();
  const activityStore = useActivityStore();
  const commentStore = useCommentStore();
  const contentElementStore = useContentElementStore();
  const userTrackingStore = useUserTracking();

  function connect(id: number) {
    feed.connect(id, (conn: any) => {
      sseId.value = conn.id;
      activityStore.$subscribeToSSE();
      commentStore.$subscribeToSSE();
      contentElementStore.$subscribeToSSE();
      userTrackingStore.$subscribeToSSE();
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      userTrackingStore.fetch(id);
    });
  }

  function disconnect() {
    clearInterval(heartbeat.value);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    if (isTracking.value) userTrackingStore.reportEnd(trackingParameters.value);
    feed.disconnect();
    sseId.value = null;
    userTrackingStore.$reset();
  }

  const trackingParameters = computed(() => ({
    sseId: sseId.value,
    repositoryId: route.params.id
      ? parseInt(route.params.id as string, 10)
      : null,
    activityId: route.params.activityId
      ? parseInt(route.params.activityId as string, 10)
      : null,
    elementId: route.query?.elementId,
  }));

  const isTracking = computed(() => {
    return (
      trackingParameters.value.sseId && trackingParameters.value.repositoryId
    );
  });

  watch(
    trackingParameters,
    async (val, prevVal) => {
      if (isEqual(val, prevVal)) return;
      if (prevVal.sseId && prevVal.repositoryId) {
        await userTrackingStore.reportEnd(prevVal);
        clearInterval(heartbeat.value);
      }
      const { sseId, repositoryId } = val;
      if (!sseId || !repositoryId) return;
      await userTrackingStore.reportStart(val);
      heartbeat.value = setInterval(
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        () => userTrackingStore.reportStart(val),
        PING_INTERVAL,
      );
    },
    { deep: true },
  );

  onBeforeUnmount(async () => {
    if (!isTracking.value) return;
    clearInterval(heartbeat.value);
    await userTrackingStore.reportEnd(trackingParameters.value);
    sseId.value = null;
    userTrackingStore.$reset();
  });

  return {
    sseId,
    connect,
    disconnect,
  };
};
