import type { SearchSort } from './useContentElementSearch';
import { omit } from 'lodash-es';
import { useLocalStorage } from '@vueuse/core';

export interface SearchState {
  q: string;
  types: string[];
  sort: SearchSort;
  page: number;
  itemsPerPage: number;
}

const STORAGE_KEY = 'tailor-cms-ce-search';
const store = useLocalStorage<Record<string, SearchState>>(STORAGE_KEY, {});

/**
 * Persists the last content-element search (query, filters, sort, page)
 * per repository in localStorage, so returning to the search page restores
 * it until the user clears the search. Results themselves aren't stored;
 * the page re-fetches from the restored criteria.
 */
export const useSearchHistory = () => {
  const get = (repositoryId: number | null | undefined): SearchState | null => {
    if (!repositoryId) return null;
    return store.value[String(repositoryId)] ?? null;
  };

  const set = (
    repositoryId: number | null | undefined,
    state: SearchState,
  ) => {
    if (!repositoryId) return;
    store.value = { ...store.value, [String(repositoryId)]: state };
  };

  const clear = (repositoryId: number | null | undefined) => {
    if (!repositoryId) return;
    store.value = omit(store.value, String(repositoryId));
  };

  return { get, set, clear };
};
