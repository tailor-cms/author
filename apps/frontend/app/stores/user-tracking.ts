import { each, find, isEmpty, isEqual, omit, orderBy, pick } from 'lodash-es';
import type { User } from '@tailor-cms/interfaces/user';
import type { UserActivityContext } from '@tailor-cms/interfaces/user-activity';
import { UserActivity } from '@tailor-cms/common/src/sse.js';

import { api } from '@/api';
import sseRepositoryFeed from '@/lib/RepositoryFeed';
import { useAuthStore } from '@/stores/auth';

// Locally we always know the sseId
// (it's the connection that delivered the event)
type ActivityContext = UserActivityContext & { sseId: string };

interface UserWithContexts extends User {
  contexts: ActivityContext[];
}

// Active users keyed by entity scope. Outer keys are the entity kinds we
// track; inner keys are the numeric/string entity ids serialized to strings
interface ActivityByEntity {
  repository: Record<string, User[]>;
  activity: Record<string, User[]>;
  element: Record<string, User[]>;
}

function isContextEqual(
  sourceContext: ActivityContext,
  targetContext: ActivityContext,
) {
  const fields = ['sseId', 'repositoryId'];
  if (sourceContext.elementId) fields.push('elementId');
  if (sourceContext.activityId) fields.push('activityId');
  return isEqual(pick(sourceContext, fields), pick(targetContext, fields));
}

export const useUserTracking = defineStore('userTracking', () => {
  const authStore = useAuthStore();
  const $users = reactive(new Map<string, UserWithContexts>());
  const users = computed(() => Array.from($users.values()));

  const activityByEntity = computed<ActivityByEntity>(() =>
    users.value.reduce<ActivityByEntity>(
      (acc, { contexts, ...user }) => {
        contexts?.forEach((ctx) => setUserContext(acc, user, ctx));
        return acc;
      },
      { repository: {}, activity: {}, element: {} },
    ),
  );

  const getActiveUsers = computed(() => {
    return (
      entity: keyof ActivityByEntity,
      entityId: number | string | undefined,
    ) => {
      if (entityId == null) return [];
      const users = activityByEntity.value[entity][String(entityId)] || [];
      return orderBy(users, 'connectedAt', 'desc').filter(
        (user) => user.email !== authStore.user?.email,
      );
    };
  });

  const fetch = (repositoryId: number) => {
    return api.repository
      .getFeed({ params: { repositoryId } })
      .then(({ items }) =>
        each(items, (v, k) => $users.set(k, v as unknown as UserWithContexts)),
      );
  };

  const reportStart = (context: ActivityContext) =>
    api.repository.reportActivityStart({
      params: { repositoryId: context.repositoryId },
      body: { context },
    });

  const reportEnd = (context: ActivityContext) =>
    api.repository.reportActivityEnd({
      params: { repositoryId: context.repositoryId },
      body: { context },
    });

  const onStartEvent = ({
    user,
    context,
  }: {
    user: User;
    context: ActivityContext;
  }) => {
    const userState = $users.get(user.id.toString()) || {
      ...user,
      contexts: [],
    };
    const existingContext = find(
      userState.contexts,
      omit(context, ['connectedAt']),
    );
    if (existingContext) return;
    $users.set(user.id.toString(), {
      ...userState,
      contexts: [...userState.contexts, context],
    });
  };

  const onEndEvent = ({
    user,
    context,
  }: {
    user: User;
    context: ActivityContext;
  }) => {
    const userState = $users.get(user.id.toString());
    if (!userState) return;
    const contexts = userState.contexts.filter(
      (it) => !isContextEqual(it, context),
    );
    $users.set(user.id.toString(), { ...userState, contexts });
  };

  const onEndSessionEvent = ({
    sseId,
    userId,
  }: {
    sseId: string;
    userId: number;
  }) => {
    const userState = $users.get(userId.toString());
    if (!userState) return;
    const contexts = userState.contexts.filter((it) => it.sseId !== sseId);
    if (isEmpty(contexts)) return $users.delete(userId.toString());
    $users.set(userId.toString(), { ...userState, contexts });
  };

  const $subscribeToSSE = () => {
    sseRepositoryFeed
      .subscribe(
        UserActivity.Start,
        ({ user, context }: { user: User; context: ActivityContext }) =>
          onStartEvent({ user, context }),
      )
      .subscribe(
        UserActivity.End,
        ({ user, context }: { user: User; context: ActivityContext }) =>
          onEndEvent({ user, context }),
      )
      .subscribe(
        UserActivity.EndSession,
        ({ sseId, userId }: { sseId: string; userId: number }) =>
          onEndSessionEvent({ sseId, userId }),
      );
  };

  function $reset() {
    $users.clear();
  }

  return {
    $users,
    users,
    activityByEntity,
    getActiveUsers,
    fetch,
    reportStart,
    reportEnd,
    $subscribeToSSE,
    $reset,
  };
});

function setUserContext(
  state: ActivityByEntity,
  user: User,
  context: ActivityContext,
) {
  const mappings: Record<keyof ActivityByEntity, number | undefined> = {
    repository: context.repositoryId,
    activity: context.activityId,
    element: context.elementId,
  };
  each(mappings, (id, type) => {
    if (!id) return;
    const key = String(id);
    const bucket = state[type as keyof ActivityByEntity];
    const entity = bucket[key];
    if (!entity) {
      bucket[key] = [user];
      return;
    }
    if (find(entity, { id: user.id })) return;
    entity.push(user);
  });
}
