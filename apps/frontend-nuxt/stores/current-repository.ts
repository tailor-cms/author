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

  const outlineState = reactive({ expanded: new Map<string, boolean>() });

  const repositoryId = computed(() => Number(route.params.id));
  const repository = computed(() => Repository.findById(repositoryId.value));

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
    const outlineTypes = taxonomy.value.map((it: any) => it.type);
    return activities.value.filter((it) => outlineTypes.includes(it.type));
  });

  const rootActivities = computed(() => {
    return outlineActivities.value.filter((it) => !it.parentId);
  });

  const selectedActivity = computed(() => {
    const { activityId } = route.query;
    if (!activityId) return;
    const id = parseInt(activityId as string, 10);
    return outlineActivities.value.find((it) => it.id === id);
  });

  function selectActivity(activityId: number) {
    const activity = Activity.findById(activityId);
    if (!activity || selectedActivity.value?.id === activity.id) return;
    navigateTo({ query: { ...route.query, activityId } });
  }

  const isOutlineExpanded = computed(() => {
    const totalItems = outlineActivities.value.length;
    const expandedItems = filter(
      outlineState.expanded.values(),
      (it) => it,
    ).length;
    return expandedItems >= totalItems;
  });

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
      toggleOutlineItemExpand(it.uid, expand),
    );
  };

  const expandOutlineParents = (id: Id) => {
    const ancestors = Activity.getAncestors(id);
    ancestors.forEach((it) => toggleOutlineItemExpand(it.uid, true));
  };

  const initialize = async () => {
    await Repository.get(repositoryId.value);
    await Activity.fetch(repositoryId.value);
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
    toggleOutlineItemExpand,
    toggleOutlineExpand,
    expandOutlineParents,
    $reset,
  };
});
