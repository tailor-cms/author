import type { MaybeRefOrGetter } from 'vue';
import { orderBy } from 'lodash-es';
import { storeToRefs } from 'pinia';

import type { CollectionSort } from '@/composables/useCollectionEntities';
import { useCurrentRepository } from '@/stores/current-repository';

/**
 * Shared filtering + sorting for a collection's flat item list. Both the
 * structure page's CollectionView and the editor sidebar's CollectionNavigation
 * render the same items, so the search/entity filter and the sort order live
 * here rather than being duplicated in each view.
 */
export function useCollectionList(
  search: MaybeRefOrGetter<string>,
  selectedEntity: MaybeRefOrGetter<string>,
) {
  const repositoryStore = useCurrentRepository();
  const { outlineActivities, rootActivities } = storeToRefs(repositoryStore);

  const sort = ref<CollectionSort>({ key: 'createdAt', order: 'desc' });

  const hasActivities = computed(() => !!rootActivities.value.length);

  const filteredBySearch = computed(() => {
    const term = toValue(search).trim();
    if (!term) return outlineActivities.value;
    const regex = new RegExp(term, 'i');
    return outlineActivities.value.filter(({ shortId, data: { name } }) => {
      return regex.test(shortId) || regex.test(name as string);
    });
  });

  const sortedItems = computed(() => {
    const type = toValue(selectedEntity);
    const items = filteredBySearch.value.filter((it) => it.type === type);
    return orderBy(items, [sort.value.key], [sort.value.order]);
  });

  return { sort, sortedItems, hasActivities };
}
