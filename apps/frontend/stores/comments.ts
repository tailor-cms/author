import { Comment as Events } from 'sse-event-types';
import filter from 'lodash/filter';

import { comment as api } from '@/api';
import type { Comment } from '@/api/interfaces/comment';
import sseRepositoryFeed from '@/lib/RepositoryFeed';
import { useAuthStore } from '@/stores/auth';

export type Id = number | string;
export type FoundComment = Comment | undefined;

export const useCommentStore = defineStore('comments', () => {
  const $items = reactive(new Map<string, Comment>());
  const $seen = reactive({
    activity: new Map<string, number>(),
    contentElement: new Map<string, number>(),
  });

  const items = computed(() => Array.from($items.values()));

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

  const getUnseenActivityComments = (activity: any) => {
    const authStore = useAuthStore();
    const activityComments = getActivityComments(activity.id);
    const activitySeenAt = $seen.activity.get(activity.uid) || 0;
    return filter(activityComments, (it) => {
      const isAuthor = it.author.id === authStore.user?.id;
      const createdAt = new Date(it.createdAt).getTime();
      if (isAuthor || activitySeenAt >= createdAt) return;
      if (!it.contentElement) return true;
      // Return unseen activity comment if contentElement is not set
      const elementSeenAt =
        $seen.contentElement.get(it.contentElement.uid) || 0;
      return elementSeenAt < createdAt;
    });
  };

  const markSeenComments = (payload: {
    activityUid: string | undefined;
    elementUid: string | undefined;
    lastCommentAt: number;
  }) => {
    const { activityUid, elementUid, lastCommentAt } = payload;
    const entity = elementUid ? 'contentElement' : 'activity';
    const resolvedKey = elementUid || (activityUid as string);
    $seen[entity].set(resolvedKey, lastCommentAt);
  };

  const updateResolvement = (repositoryId: number, data: any) => {
    return api
      .resolve(repositoryId, data)
      .then(() => fetch(repositoryId, data));
  };

  const $plugSSE = () => {
    sseRepositoryFeed
      .subscribe(Events.Create, (it: Comment) => add(it))
      .subscribe(Events.Update, (it: Comment) => add(it))
      .subscribe(Events.Delete, (it: Comment) => $items.delete(it.uid));
  };

  function $reset() {
    $items.clear();
    $seen.activity.clear();
    $seen.contentElement.clear();
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
    $plugSSE,
    $reset,
  };
});
