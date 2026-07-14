import { omit } from 'lodash-es';
import { useLocalStorage } from '@vueuse/core';

const STORAGE_KEY = 'tailor-cms-recent-repositories';
const store = useLocalStorage<Record<string, number>>(STORAGE_KEY, {});

/**
 * Persists when the user last visited each repository (localStorage,
 * repository id -> visit timestamp). Ids only; consumers resolve fresh
 * repository data via the list endpoint's `ids` filter.
 */
export const useRecentRepositories = () => {
  const ids = computed(() => Object.entries(store.value)
    .sort(([, a], [, b]) => b - a)
    .map(([id]) => Number(id)),
  );

  const touch = (id: number) => {
    store.value = { ...store.value, [id]: Date.now() };
  };

  const remove = (ids: number[]) => {
    store.value = omit(store.value, ids.map(String));
  };

  return { ids, touch, remove };
};
