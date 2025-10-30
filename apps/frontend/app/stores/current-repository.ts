import {
  schema as schemaConfig,
  workflow as workflowConfig,
} from '@tailor-cms/config';
import {
  calculatePosition,
  InsertLocation,
} from '@tailor-cms/utils';

import { useActivityStore } from './activity';
import { useRepositoryStore } from './repository';
import { repository as repositoryApi } from '@/api';
import type { ChangeEvent } from '~/lib/vue-dragggable';

const { getOutlineLevels, getSchema } = schemaConfig;
const { getWorkflow } = workflowConfig;

type Id = number | string;

interface OutlineState {
  selectedActivityId: Id | null;
  expanded: Map<string, boolean>;
}

const getOutlineKey = (repositoryId: Id) =>
  `tailor-cms-outline:${repositoryId}`;

const loadOutline = (repositoryId: Id) => {
  const outline = localStorage.getItem(getOutlineKey(repositoryId));
  const { selectedActivityId = null, expanded } = JSON.parse(outline ?? '{}');
  return { selectedActivityId, expanded: new Map(expanded) };
};

const saveOutline = (repositoryId: Id, outlineState: OutlineState) => {
  const data = JSON.stringify({
    selectedActivityId: outlineState.selectedActivityId,
    expanded: Array.from(outlineState.expanded.entries()),
  });
  localStorage.setItem(getOutlineKey(repositoryId), data);
};

export const useCurrentRepository = defineStore('currentRepository', () => {
  const route = useRoute();
  const Repository = useRepositoryStore();
  const Activity = useActivityStore();

  const $users = reactive(new Map<string, any>());
  const users = computed(() => Array.from($users.values()));

  const outlineState = reactive({
    selectedActivityId: null as Id | null,
    expanded: new Map<string, boolean>(),
  });

  const repositoryId = ref<number | null>(null);

  const repository = computed(() => {
    return repositoryId.value ? Repository.findById(repositoryId.value) : null;
  });

  const userGroups = computed(() => repository.value?.userGroups ?? []);

  const schemaName = computed(() => {
    return repository.value && getSchema(repository.value.schema).name;
  });

  const taxonomy = computed(() => {
    return repository.value && getOutlineLevels(repository.value.schema);
  });

  const activities = computed(() => {
    if (!repositoryId.value) return [];
    return Activity.where((it) => it.repositoryId === repositoryId.value);
  });

  const outlineActivities = computed(() => {
    if (!taxonomy.value) return [];
    const outlineTypes: string[] = taxonomy.value.map((it: any) => it.type);
    return activities.value.filter((it) => outlineTypes.includes(it.type));
  });

  const rootActivities = computed(() => {
    const items = outlineActivities.value.filter((it) => !it.parentId);
    return items.sort((a, b) => a.position - b.position);
  });

  const selectedActivity = computed(() => {
    const id = outlineState.selectedActivityId;
    return outlineActivities.value.find((it) => it.id === id);
  });

  function selectActivity(activityId: number) {
    const activity = Activity.findById(activityId);
    if (!activity || selectedActivity.value?.id === activity.id) return;
    outlineState.selectedActivityId = activity.id;
    return navigateTo({ query: { ...route.query, activityId } });
  }
  const workflow = computed(() => {
    if (!repository.value) return null;
    const schema = getSchema(repository.value.schema);
    return getWorkflow(schema.workflowId);
  });

  const workflowActivities = computed(() => {
    return activities.value.filter(
      (it) => !it.detached && it.isTrackedInWorkflow,
    );
  });

  const isOutlineExpanded = computed(() => {
    if (!repository.value) return false;
    const totalItems = outlineActivities.value.length;
    const itemStates = outlineActivities.value.map((it) =>
      outlineState.expanded.get(it.uid));
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

  // Used for drag & drop of outline activities
  const handleOutlineItemDrag = async (
    context: ChangeEvent = {},
    parentId: number | null = null,
  ) => {
    const { added } = context;
    if (!added?.element?.id) return;
    const { element } = added;
    const config = taxonomy.value?.find((it: any) => it.type === element.type);
    if (!config) return;
    // Check if the element can be moved to the new parent
    // type must be in the subLevels of the parent type
    if (parentId) {
      const parent = Activity.findById(parentId);
      if (!parent) return;
      const parentConfig = taxonomy.value?.find(
        (it: any) => it.type === parent.type,
      );
      if (!parentConfig?.subLevels?.includes(element.type)) return;
    } else if (!config.rootLevel) {
      // If parentId is null, the element must be a root level
      return;
    }
    const children = schemaConfig.getOutlineChildren(Activity.items, parentId);
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
  };

  function $reset() {
    if (repositoryId.value) saveOutline(repositoryId.value, outlineState);
    repositoryId.value = null;
    outlineState.expanded.clear();
    $users.clear();
  }

  const getUsers = () => {
    if (!repositoryId.value) throw new Error('Repository not initialized!');
    return repositoryApi
      .getUsers(repositoryId.value)
      .then((users) =>
        users.forEach((it: any) => $users.set(it.id.toString(), it)),
      );
  };

  const upsertUser = (email: string, role: string) => {
    if (!repositoryId.value) throw new Error('Repository not initialized!');
    return repositoryApi
      .upsertUser(repositoryId.value, { email, role })
      .then((user) => $users.set(user.id.toString(), user));
  };

  const removeUser = (userId: number) => {
    if (!repositoryId.value) throw new Error('Repository not initialized!');
    return repositoryApi.removeUser(repositoryId.value, userId).then(() => {
      $users.delete(userId.toString());
    });
  };

  return {
    initialize,
    repositoryId,
    repository,
    $users,
    users,
    userGroups,
    outlineState,
    schemaName,
    taxonomy,
    activities,
    outlineActivities,
    rootActivities,
    selectActivity,
    selectedActivity,
    workflow,
    workflowActivities,
    isOutlineExpanded,
    isOutlineItemExpanded,
    toggleOutlineItemExpand,
    toggleOutlineExpand,
    expandOutlineParents,
    handleOutlineItemDrag,
    getUsers,
    upsertUser,
    removeUser,
    $reset,
  };
});
