import {
  schema as schemaConfig,
  workflow as workflowConfig,
} from 'tailor-config-shared';

import { repository as repositoryApi } from '@/api';
import { useActivityStore } from './activity';
import { useRepositoryStore } from './repository';

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

  const $brokenReferences = reactive({
    elements: [],
    activities: [],
    warnings: [] as any[],
  });

  const repository = computed(() => {
    return repositoryId.value ? Repository.findById(repositoryId.value) : null;
  });

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
    const toggleState = outlineState.expanded.values();
    const expandedItems = Array.from(toggleState).filter(Boolean).length;
    return expandedItems >= totalItems;
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

  const initialize = async (repoId: number) => {
    repositoryId.value = repoId;
    Object.assign(outlineState, loadOutline(repoId));
    await Repository.get(repoId);
    await Activity.fetch(repoId, { outlineOnly: true });
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    validateReferences();
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

  const validateReferences = async () => {
    if (!repositoryId.value) throw new Error('Repository not initialized!');
    const { activities, elements } = await repositoryApi.validateReferences(
      repositoryId.value,
    );
    $brokenReferences.activities = activities;
    $brokenReferences.elements = elements;
    $brokenReferences.warnings = [];
    activities.forEach((it: any) => {
      $brokenReferences.warnings.push({
        id: it.entity.id,
        message: `
          ${it.entity.data.name}
          "${schemaConfig.getLevel(it.entity.type).label}" "${it.type}"
          relationship does not exist anymore. Relationship needs to be removed.
          If related item removal is published, make sure to publish this
          activity as well.`,
      });
    });
    const { $ceRegistry } = useNuxtApp() as any;
    elements.forEach((it: any) => {
      $brokenReferences.warnings.push({
        link: `/repository/${it.entity.repositoryId}/editor/${it.outlineActivity.id}?elementId=${it.entity.uid}`,
        message: `
          "${$ceRegistry.get(it.entity.type).name}" element relationship
          "${it.type}" does not exist anymore. Relationship needs to be
          removed. If related element removal is published, make sure to
          publish this element as well.`,
      });
    });
  };

  const cleanupReferences = async () => {
    if (!repositoryId.value) throw new Error('Repository not initialized!');
    await repositoryApi.cleanupReferences(
      repositoryId.value,
      $brokenReferences,
    );
    await validateReferences();
  };

  return {
    initialize,
    repositoryId,
    repository,
    $users,
    $brokenReferences,
    users,
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
    getUsers,
    upsertUser,
    removeUser,
    validateReferences,
    cleanupReferences,
    $reset,
  };
});
