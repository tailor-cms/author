import filter from 'lodash/filter';
import { schema as schemaConfig } from 'tailor-config-shared';

import { useActivityStore } from './activity';
import { useRepositoryStore } from './repository';

const { getOutlineLevels, getSchema } = schemaConfig;

type Id = number | string;

export const useCurrentRepository = defineStore('currentRepository', () => {
  const route = useRoute();
  const Repository = useRepositoryStore();
  const Activity = useActivityStore();

  const outlineState = reactive({
    selectedActivityId: null as Id | null,
    expanded: new Map<string, boolean>(),
  });

  const repositoryId = ref<number | null>(null);
  const repository = computed(
    () => repositoryId.value && Repository.findById(repositoryId.value),
  );

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
    navigateTo({ query: { ...route.query, activityId } });
  }

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
    await Repository.get(repoId);
    await Activity.fetch(repoId);
  };

  function $reset() {
    outlineState.expanded.clear();
  }

  return {
    initialize,
    repositoryId,
    repository,
    outlineState,
    schemaName,
    taxonomy,
    activities,
    outlineActivities,
    rootActivities,
    selectActivity,
    selectedActivity,
    isOutlineExpanded,
    isOutlineItemExpanded,
    toggleOutlineItemExpand,
    toggleOutlineExpand,
    expandOutlineParents,
    $reset,
  };
});
