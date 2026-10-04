import type {
  MessagingListReq,
  MessagingResolveReq,
} from '@tailor-cms/api-client';
import type { Comment, Message } from '@tailor-cms/interfaces/comment';
import type { MessageCache } from './messageCache';
import { useStorage } from '@vueuse/core';

import { api } from '@/api';
import { useAuthStore } from '@/stores/auth';

interface SeenAnchor {
  activityUid?: string;
  elementUid?: string;
}

/**
 * Left on an activity or element, rather than posted to a channel
 * thread.
 */
export const isContentComment = (it: Message): it is Comment =>
  !!it.activityId;

/**
 * Comments anchored to content.
 */
export const createComments = (messageCache: MessageCache) => {
  const authStore = useAuthStore();

  const seenAt = useStorage('tailor-cms-comments-seen', {
    activity: {} as Record<string, number>,
    contentElement: {} as Record<string, number>,
  });

  const comments = computed(() => messageCache.where(isContentComment));

  const getActivityComments = (activityId: number) =>
    comments.value.filter((it) => it.activityId === activityId);

  const getElementComments = (elementUid: string) =>
    comments.value.filter((it) => it.contentElement?.uid === elementUid);

  const getLastSeen = ({ activityUid, elementUid }: SeenAnchor) =>
    Math.max(
      (activityUid && seenAt.value.activity[activityUid]) || 0,
      (elementUid && seenAt.value.contentElement[elementUid]) || 0,
    );

  function getUnseenActivityComments(activity: StoreActivity) {
    const me = authStore.user?.id;
    return getActivityComments(activity.id).filter((it) => {
      if (it.author?.id === me) return false;
      const lastSeen = getLastSeen({
        activityUid: activity.uid,
        elementUid: it.contentElement?.uid,
      });
      return new Date(it.createdAt).getTime() > lastSeen;
    });
  }

  function markCommentsSeen({
    activityUid,
    elementUid,
    lastCommentAt,
  }: SeenAnchor & { lastCommentAt: number }) {
    if (elementUid) seenAt.value.contentElement[elementUid] = lastCommentAt;
    else if (activityUid) seenAt.value.activity[activityUid] = lastCommentAt;
  }

  async function fetchComments(
    repositoryId: number,
    query: MessagingListReq['query'],
  ) {
    if (!query?.activityId && !query?.contentElementId)
      throw new Error('Invalid params');
    const items = await api.messaging.list({
      params: { repositoryId },
      query,
    });
    items.forEach((it) => messageCache.setLocal(it as Message));
    return items;
  }

  async function resolveComments(
    repositoryId: number,
    data: MessagingResolveReq['body'] & MessagingListReq['query'],
  ) {
    await api.messaging.resolve({ params: { repositoryId }, body: data });
    return fetchComments(repositoryId, data);
  }

  return {
    getActivityComments,
    getElementComments,
    getUnseenActivityComments,
    getLastSeen,
    markCommentsSeen,
    fetchComments,
    resolveComments,
  };
};
