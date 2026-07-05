import { storeToRefs } from 'pinia';
import { useCurrentRepository } from '@/stores/current-repository';

// One option in the entity chip filter.
export interface EntityFilterOption {
  label: string;
  value: string;
  icon: string;
}

// Sort settings for the collection list.
export interface CollectionSort {
  key: 'data.name' | 'createdAt';
  order: 'asc' | 'desc';
}

/**
 * Backs the entity chip filter for a collection repository. A collection holds
 * several item types - its "entities" (e.g. Articles, Authors, Tags) - and this
 * exposes them as filter options, tracks which one is active, and says whether a
 * filter is worth showing at all. Does nothing for regular outline schemas.
 */
export function useCollectionEntities() {
  const repositoryStore = useCurrentRepository();
  const { taxonomy, selectedActivity } = storeToRefs(repositoryStore);
  // The collection's item types as chip options. Empty for non-collection
  // (outline) schemas, so this composable stays idle there.
  const entities = computed<EntityFilterOption[]>(() => {
    if (!repositoryStore.isCollection) return [];
    return (taxonomy.value ?? [])
      .filter((it: any) => it.rootLevel)
      .map((it: any) => ({
        label: it.label,
        value: it.type,
        icon: it.icon || 'mdi-shape-outline',
      }));
  });

  // The filter only makes sense when there's more than one type to switch between.
  const hasMultipleEntities = computed(() => entities.value.length > 1);

  // Selected entity type
  const chosen = ref('');
  const selectedEntity = computed<string>({
    get: () =>
      entities.value.some((it) => it.value === chosen.value)
        ? chosen.value
        : entities.value[0]?.value ?? '',
    set: (value) => {
      chosen.value = value;
      // Switching the filter moves the selection onto an item of the new type
      if (!repositoryStore.isCollection) return;
      if (selectedActivity.value?.type === value) return;
      const first = repositoryStore.rootActivities.find(
        (it: any) => it.type === value,
      );
      if (first) repositoryStore.selectActivity(first.id);
    },
  });

  // Keep the filter in sync with whatever item ends up selected
  watch(
    () => selectedActivity.value?.type,
    (type) => {
      if (type && entities.value.some((it) => it.value === type)) {
        chosen.value = type;
      }
    },
    { immediate: true },
  );

  return { entities, selectedEntity, hasMultipleEntities };
}
