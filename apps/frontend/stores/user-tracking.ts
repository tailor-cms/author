import each from 'lodash/each';
import find from 'lodash/find';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import omit from 'lodash/omit';
import orderBy from 'lodash/orderBy';
import pick from 'lodash/pick';
import type { User } from '@tailor-cms/interfaces/user';
import { UserActivity } from 'sse-event-types';

import { feed as api } from '@/api';
import sseRepositoryFeed from '@/lib/RepositoryFeed';
import { useAuthStore } from '@/stores/auth';

interface ActivityContext {
  sseId: string;
  repositoryId: number;
  activityId?: number;
  elementId?: number;
}

interface UserWithContexts extends User {
  contexts: ActivityContext[];
}

interface ActivityByEntity {
  repository: { number: User[] };
  activity: { number: User[] };
  element: { string: User[] };
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

  const activityByEntity = computed(() => {
    return users.value.reduce(
      (acc: any, { contexts, ...user }: UserWithContexts): ActivityByEntity => {
        contexts.forEach((ctx: any) => setUserContext(acc, user, ctx));
        return acc;
      },
      { repository: {}, activity: {}, element: {} },
    );
  });

  const getActiveUsers = computed(() => {
    return (entity: 'repository' | 'activity' | 'element', entityId: any) => {
      const users = activityByEntity.value[entity][entityId] || [];
      return orderBy(users, 'connectedAt', 'desc').filter(
        (user) => user.email !== authStore.user?.email,
      );
    };
  });

  const fetch = (repositoryId: number) => {
    return api
      .fetch(repositoryId)
      .then(({ items }) =>
        each(items, (v: UserWithContexts, k) => $users.set(k, v)),
      );
  };

  const reportStart = (context: ActivityContext) => api.start(context);

  const reportEnd = (context: ActivityContext) => api.end(context);

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
    const userState: any = $users.get(user.id.toString());
    if (!userState) return;
    const contexts = userState.contexts.filter(
      (it: ActivityContext) => !isContextEqual(it, context),
    );
    $users.set(user.id.toString(), {
      ...userState,
      contexts,
    });
  };

  const onEndSessionEvent = ({
    sseId,
    userId,
  }: {
    sseId: string;
    userId: number;
  }) => {
    const userState: any = $users.get(userId.toString()) as UserWithContexts;
    if (!userState) return;
    const contexts = userState.contexts.filter(
      (it: ActivityContext) => it.sseId !== sseId,
    );
    if (isEmpty(contexts)) return $users.delete(userId.toString());
    $users.set(userId.toString(), {
      ...userState,
      contexts,
    });
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

function setUserContext(state: any, user: User, context: ActivityContext) {
  const mappings = {
    repository: context.repositoryId,
    activity: context.activityId,
    element: context.elementId,
  };
  each(mappings, (id, type) => {
    if (!id) return;
    const entity = state[type][id];
    if (!entity) {
      state[type][id] = [user];
      return;
    }
    if (find(entity, { id: user.id })) return;
    entity.push(user);
  });
}
