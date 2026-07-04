import type { ChangeEvent, MoveEvent } from '@/types/draggable';
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { RepositoryMember } from '@tailor-cms/interfaces/repository';
import type { RepositoryRole } from '@tailor-cms/interfaces/role';

import {
  schema as schemaApi,
  workflow as workflowConfig,
} from '@tailor-cms/config';
import { calculatePosition, InsertLocation } from '@tailor-cms/utils';

import { api } from '@/api';
import { useActivityStore } from './activity';
import { useRepositoryStore } from './repository';

const { getWorkflow } = workflowConfig;

type Id = number | string;

interface OutlineState {
  expanded: Map<string, boolean>;
}

const getOutlineKey = (repositoryId: Id) =>
  `tailor-cms-outline:${repositoryId}`;

const loadOutline = (repositoryId: Id) => {
  const outline = localStorage.getItem(getOutlineKey(repositoryId));
  const { expanded } = JSON.parse(outline ?? '{}');
  return { expanded: new Map<string, boolean>(expanded) };
};

const saveOutline = (repositoryId: Id, outlineState: OutlineState) => {
  const data = JSON.stringify({
    expanded: Array.from(outlineState.expanded.entries()),
  });
  localStorage.setItem(getOutlineKey(repositoryId), data);
};

export const useCurrentRepository = defineStore('currentRepository', () => {
  const { $pluginRegistry } = useNuxtApp() as any;
  const route = useRoute();
  const Repository = useRepositoryStore();
  const Activity = useActivityStore();

  const $users = reactive(new Map<string, RepositoryMember>());
  const users = computed(() => Array.from($users.values()));

  const outlineState = reactive({
    expanded: new Map<string, boolean>(),
  });

  const repositoryId = ref<number | null>(null);

  const repository = computed(() => {
    return repositoryId.value ? Repository.findById(repositoryId.value) : null;
  });

  const schema = computed(() => {
    return repository.value && schemaApi.getSchema(repository.value.schema);
  });

  const schemaName = computed(() => schema.value?.name || '');

  const isCollection = computed(() => schema.value?.collection);

  const taxonomy = computed(() => {
    return (
      repository.value && schemaApi.getOutlineLevels(repository.value.schema)
    );
  });

  const activities = computed(() => {
    if (!repositoryId.value) return [];
    return Activity.where((it) => it.repositoryId === repositoryId.value);
  });

  const outlineActivities = computed(() => {
    if (!taxonomy.value) return [];
    const outlineTypes: string[] = taxonomy.value.map((it) => it.type);
    return activities.value.filter((it) => outlineTypes.includes(it.type));
  });

  const rootActivities = computed(() => {
    const items = outlineActivities.value.filter((it) => !it.parentId);
    return items.sort((a, b) => a.position - b.position);
  });

  const selectedActivity = computed(() => {
    const id = parseInt(route.query.activityId as string, 10);
    if (Number.isNaN(id)) return undefined;
    return outlineActivities.value.find((it) => it.id === id);
  });

  function selectActivity(activityId: number) {
    const activity = Activity.findById(activityId);
    if (!activity || selectedActivity.value?.id === activity.id) return;
    return navigateTo({ query: { ...route.query, activityId } });
  }

  function deselectActivity() {
    if (!route.query.activityId) return;
    const { activityId: _omit, ...query } = route.query;
    return navigateTo({ query });
  }
  const workflow = computed(() => {
    if (!schema.value) return null;
    return getWorkflow(schema.value.workflowId);
  });

  const workflowActivities = computed(() => {
    return activities.value.filter(
      (it) => !it.detached && it.isTrackedInWorkflow,
    );
  });

  // Outline types present among tracked activities, in taxonomy order (with
  // their label/color). Type indicators are hidden below two types.
  const activityTypes = computed(() => {
    const present = new Set(workflowActivities.value.map((it) => it.type));
    return (taxonomy.value ?? []).filter((it: any) => present.has(it.type));
  });
  const hasMultipleTypes = computed(() => activityTypes.value.length > 1);

  const isOutlineExpanded = computed(() => {
    if (!repository.value) return false;
    const totalItems = outlineActivities.value.length;
    const itemStates = outlineActivities.value.map((it) =>
      outlineState.expanded.get(it.uid),
    );
    const expandedItems = itemStates.filter(Boolean).length;
    return expandedItems === totalItems;
  });

  const isOutlineItemExpanded = (id: Id) => {
    const activity = Activity.findById(id);
    if (!activity) return false;
    return !!outlineState.expanded.get(activity.uid);
  };

  const toggleOutlineItemExpand = (
    uid: string,
    expanded: boolean | undefined,
  ) => {
    const expandedItems = outlineState.expanded;
    expanded = expanded === undefined ? !expandedItems.get(uid) : expanded;
    outlineState.expanded.set(uid, expanded);
  };

  const toggleOutlineExpand = () => {
    const expand = !isOutlineExpanded.value;
    outlineActivities.value.forEach((it) =>
      outlineState.expanded.set(it.uid, expand),
    );
  };

  const expandOutlineParents = (id: Id) => {
    const ancestors = Activity.getAncestors(id);
    ancestors.forEach((it) => toggleOutlineItemExpand(it.uid, true));
  };

  const isValidDrop = ({
    to,
    from,
    draggedContext,
  }: MoveEvent<Activity>): boolean => {
    const elementType = draggedContext?.element?.type;
    if (!elementType) return false;
    // Allow reordering within the same list
    if (from === to) return true;
    const targetParentId = to?.dataset?.parentId
      ? parseInt(to.dataset.parentId, 10)
      : null;

    const config = taxonomy.value?.find((it) => it.type === elementType);
    if (!config) return false;

    if (targetParentId === null) return config.rootLevel ?? false;

    const parent = Activity.findById(targetParentId);
    if (!parent) return false;
    const parentConfig = taxonomy.value?.find((it) => it.type === parent.type);
    return parentConfig?.subLevels?.includes(elementType) ?? false;
  };

  const onOutlineItemDrop = async (
    context: ChangeEvent<Activity> = {},
    parentId: number | null = null,
  ) => {
    const { added } = context;
    if (!added?.element?.id) return;
    const children = schemaApi.getOutlineChildren(Activity.items, parentId);
    const position = calculatePosition({
      items: children,
      action: InsertLocation.AddBefore,
      newPosition: added.newIndex,
    });
    await Activity.update({
      id: added.element.id,
      parentId,
      position,
    });
  };

  const initialize = async (repoId: number) => {
    repositoryId.value = repoId;
    Object.assign(outlineState, loadOutline(repoId));
    await Repository.get(repoId);
    await Activity.fetch(repoId, { outlineOnly: true });
    // Notify plugins about repository change (e.g., i18n initialization)
    if (repository.value) {
      $pluginRegistry.filter('repository:change', null, {
        schema: schema.value,
        repository: repository.value,
      });
    }
  };

  function $reset() {
    if (repositoryId.value) saveOutline(repositoryId.value, outlineState);
    repositoryId.value = null;
    outlineState.expanded.clear();
    $users.clear();
    // Notify plugins about repository unload (e.g., i18n reset)
    $pluginRegistry.filter('repository:unload', null, {});
  }

  const getUsers = () => {
    if (!repositoryId.value) throw new Error('Repository not initialized!');
    return api.repository
      .getUsers({ params: { repositoryId: repositoryId.value } })
      .then((users) =>
        users.forEach((it) => $users.set(it.id.toString(), it)),
      );
  };

  const upsertUser = (email: string, role: RepositoryRole) => {
    if (!repositoryId.value) throw new Error('Repository not initialized!');
    return api.repository
      .addUser({
        params: { repositoryId: repositoryId.value },
        body: { email, role },
      })
      .then(({ user }) => $users.set(user.id.toString(), user));
  };

  const removeUser = (userId: number) => {
    if (!repositoryId.value) throw new Error('Repository not initialized!');
    return api.repository
      .removeUser({ params: { repositoryId: repositoryId.value, userId } })
      .then(() => {
        $users.delete(userId.toString());
      });
  };

  // Plugin RPC is by-design schema-opaque: each plugin owns its own
  // payload shape, so `body` stays `unknown` end-to-end.
  const rpc = (type: string, procedure: string, payload: unknown = {}) => {
    if (!repositoryId.value) throw new Error('Repository not initialized!');
    return api.repository.callRpc({
      params: { repositoryId: repositoryId.value, type, procedure },
      body: payload,
    });
  };

  return {
    initialize,
    repositoryId,
    repository,
    $users,
    users,
    outlineState,
    schemaName,
    isCollection,
    taxonomy,
    activities,
    outlineActivities,
    rootActivities,
    selectActivity,
    deselectActivity,
    selectedActivity,
    workflow,
    workflowActivities,
    activityTypes,
    hasMultipleTypes,
    isOutlineExpanded,
    isOutlineItemExpanded,
    toggleOutlineItemExpand,
    toggleOutlineExpand,
    expandOutlineParents,
    isValidDrop,
    onOutlineItemDrop,
    getUsers,
    upsertUser,
    removeUser,
    rpc,
    $reset,
  };
});
