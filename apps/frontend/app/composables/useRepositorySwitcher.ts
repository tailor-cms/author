import type { Repository } from '@tailor-cms/interfaces/repository';
import { keyBy, partition } from 'lodash-es';
import { useDebounceFn } from '@vueuse/core';

import { api } from '@/api';

/**
 * Standalone repository search for the navbar repository selector. Keeps its
 * own result set so it never touches the catalog store's paginated query
 * state.
 */
export function useRepositorySwitcher() {
  const recentRepositories = useRecentRepositories();

  const search = ref('');
  const items = ref<Repository[]>([]);
  const recentItems = ref<Repository[]>([]);
  const isLoading = ref(false);
  const hasLoaded = ref(false);

  // Ids the endpoint does not return (deleted repo or access revoked)
  // are pruned from the recents store.
  async function fetchRecent(ids: number[]) {
    if (!ids.length) return;
    const { items: repositories } = await api.repository.list({
      query: { ids, offset: 0, limit: ids.length },
    });
    const byId = keyBy(repositories, 'id');
    const [found, missing] = partition(ids, (id) => byId[id]);
    recentItems.value = found.map((id) => byId[id]!);
    if (missing.length) recentRepositories.remove(missing);
  }

  async function fetch() {
    const query = search.value;
    if (!query) return;
    isLoading.value = true;
    try {
      const { items: repositories } = await api.repository.list({
        query: {
          search: query,
          offset: 0,
          limit: 20,
          sortBy: 'name',
          sortOrder: 'ASC',
        },
      });
      // Drop stale responses (query changed mid-flight)
      if (search.value !== query) return;
      items.value = repositories;
      hasLoaded.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  const debouncedFetch = useDebounceFn(fetch, 300);
  watch(search, (value) => {
    if (value) return debouncedFetch();
    items.value = [];
    hasLoaded.value = false;
  });

  return { search, items, recentItems, isLoading, hasLoaded, fetchRecent };
}
