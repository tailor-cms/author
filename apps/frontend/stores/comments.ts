import type { Activity } from '@tailor-cms/interfaces/activity';
import type { Comment } from '@tailor-cms/interfaces/comment';
import { Comment as Events } from 'sse-event-types';
import { useStorage } from '@vueuse/core';

import { comment as api } from '@/api';
import sseRepositoryFeed from '@/lib/RepositoryFeed';
import { useAuthStore } from '@/stores/auth';

type Id = number | string;
export type FoundComment = Comment | undefined;

export const useCommentStore = defineStore('comments', () => {
  const $items = reactive(new Map<string, Comment>());
  const items = computed(() => Array.from($items.values()));

  const $seen = useStorage('tailor-cms-comments-seen', {
    activity: {} as Record<string, number>,
    contentElement: {} as Record<string, number>,
  });

  function findById(id: Id): FoundComment {
    if (typeof id === 'string') return $items.get(id);
    return items.value.find((it) => it.id === id);
  }

  function where(predicate: (activity: Comment) => boolean): Comment[] {
    return items.value.filter(predicate);
  }

  function add(item: Comment): Comment {
    $items.set(item.uid, item);
    return $items.get(item.uid) as Comment;
  }

  async function fetch(
    repositoryId: number,
    params: {
      activityId?: number | null;
      contentElementId?: number | null;
    },
  ): Promise<Comment[]> {
    if (!params.activityId && !params.contentElementId)
      throw new Error('Invalid params');
    const comments: Comment[] = await api.fetch(repositoryId, params);
    comments.forEach((it) => add(it));
    return items.value;
  }

  async function save(payload: any): Promise<Comment> {
    const { id, repositoryId, ...rest } = payload;
    const comment = id
      ? await api.patch(repositoryId, id, rest)
      : await api.create(payload);
    // TODO: Check if this is needed
    // if (!hasUnresolvedComments) this.fetchComments({ elementId });
    return add(comment);
  }

  async function remove(repositoryId: number, id: number): Promise<undefined> {
    const comment = findById(id);
    if (!comment) throw new Error('Comment not found');
    const commentWithoutContent = await api.remove(repositoryId, id);
    $items.set(comment.uid, commentWithoutContent);
  }

  const getActivityComments = (activityId: number) => {
    return where((it) => it.activityId === activityId);
  };

  const getUnseenActivityComments = (activity: StoreActivity) => {
    const authStore = useAuthStore();
    const activityComments = getActivityComments(activity.id);
    const activitySeenAt = $seen.value.activity[activity.uid] || 0;
    return activityComments.filter((it) => {
      const isAuthor = it.author.id === authStore.user?.id;
      const createdAt = new Date(it.createdAt).getTime();
      if (isAuthor || activitySeenAt >= createdAt) return false;
      if (!it.contentElement) return true;
      // Return unseen activity comment if contentElement is not set
      const elementSeenAt =
        $seen.value.contentElement[it.contentElement.uid] || 0;
      return elementSeenAt < createdAt;
    });
  };

  const markSeenComments = (payload: {
    activityUid: string | undefined;
    elementUid?: string | undefined;
    lastCommentAt: number;
  }) => {
    const { activityUid, elementUid, lastCommentAt } = payload;
    const entity = elementUid ? 'contentElement' : 'activity';
    const resolvedKey = elementUid || (activityUid as string);
    $seen.value[entity][resolvedKey] = lastCommentAt;
  };

  const updateResolvement = (repositoryId: number, data: any) => {
    return api
      .resolve(repositoryId, data)
      .then(() => fetch(repositoryId, data));
  };

  const $subscribeToSSE = () => {
    sseRepositoryFeed
      .subscribe(Events.Create, (it: Comment) => add(it))
      .subscribe(Events.Update, (it: Comment) => add(it))
      .subscribe(Events.Delete, (it: Comment) => $items.delete(it.uid));
  };

  function $reset() {
    $items.clear();
  }

  return {
    $items,
    $seen,
    items,
    findById,
    where,
    add,
    fetch,
    save,
    remove,
    markSeenComments,
    getActivityComments,
    getUnseenActivityComments,
    updateResolvement,
    $subscribeToSSE,
    $reset,
  };
});
