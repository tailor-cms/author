import type { LiveUserActivity } from '@tailor-cms/interfaces/user-activity';

import { isEqual } from 'lodash-es';

import feed from '@/lib/RepositoryFeed';
import { useActivityStore } from '@/stores/activity';
import { useCommentStore } from '@/stores/comments';
import { useContentElementStore } from '@/stores/content-elements';

// Report user activity every 30s
const PING_INTERVAL = 30000;

/**
 * Narrows the loosely-typed connection params to a context the
 * tracking store accepts (or null when the required ids are not yet known).
 */
function toTrackingContext(
  params: Partial<LiveUserActivity>,
): LiveUserActivity | null {
  const { sseId, repositoryId } = params;
  if (!sseId || !repositoryId) return null;
  return { ...params, sseId, repositoryId };
}

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

      userTrackingStore.fetch(id);
    });
  }

  function disconnect() {
    clearInterval(heartbeat.value);

    const context = trackingContext.value;
    if (context) userTrackingStore.reportEnd(context);
    feed.disconnect();
    sseId.value = null;
    userTrackingStore.$reset();
  }

  const trackingParameters = computed(() => ({
    sseId: sseId.value ?? undefined,
    repositoryId: route.params.id
      ? parseInt(route.params.id as string, 10)
      : undefined,
    activityId: route.params.activityId
      ? parseInt(route.params.activityId as string, 10)
      : undefined,
    elementId: (route.query?.elementId as string) || undefined,
  }));

  const trackingContext = computed(() =>
    toTrackingContext(trackingParameters.value),
  );

  watch(
    trackingParameters,
    async (val, prevVal) => {
      if (isEqual(val, prevVal)) return;
      const prevContext = toTrackingContext(prevVal);
      if (prevContext) {
        await userTrackingStore.reportEnd(prevContext);
        clearInterval(heartbeat.value);
      }
      const context = toTrackingContext(val);
      if (!context) return;
      await userTrackingStore.reportStart(context);
      heartbeat.value = setInterval(
        () => userTrackingStore.reportStart(context),
        PING_INTERVAL,
      );
    },
    { deep: true },
  );

  onBeforeUnmount(async () => {
    const context = trackingContext.value;
    if (!context) return;
    clearInterval(heartbeat.value);
    await userTrackingStore.reportEnd(context);
    sseId.value = null;
    userTrackingStore.$reset();
  });

  return {
    sseId,
    connect,
    disconnect,
  };
};
