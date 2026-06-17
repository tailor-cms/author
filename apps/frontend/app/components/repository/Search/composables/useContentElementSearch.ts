import { api } from '@/api';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import pMinDelay from 'p-min-delay';

const MIN_LOADING_MS = 300;
export const PAGE_SIZE_OPTIONS = [10, 25, 50];
export const DEFAULT_PAGE_SIZE = 10;

export type SearchSort = 'relevance' | 'newest' | 'oldest';
export type SearchElement = ContentElement & {
  outlineActivityId?: number | null;
  searchSnippet?: string | null;
};

/**
 * Paginated content-element search state for a repository. Holds the
 * current result page; query/filter params are supplied by the caller
 * on each fetch.
 */
export function useContentElementSearch(
  repositoryId: Ref<number | undefined>,
) {
  const elements = ref<SearchElement[]>([]);
  const total = ref(0);
  const page = ref(1);
  const itemsPerPage = ref(DEFAULT_PAGE_SIZE);
  const isFetching = ref(true);

  const pageCount = computed(() =>
    Math.max(1, Math.ceil(total.value / itemsPerPage.value)),
  );

  async function fetch(params: Record<string, any> = {}) {
    if (!repositoryId.value) return;
    isFetching.value = true;
    try {
      const promise = api.contentElement.search({
        params: { repositoryId: repositoryId.value },
        query: {
          offset: (page.value - 1) * itemsPerPage.value,
          limit: itemsPerPage.value,
          ...params,
        },
      });
      const result = await pMinDelay(promise, MIN_LOADING_MS);
      elements.value = result.items;
      total.value = result.total;
    } finally {
      isFetching.value = false;
    }
  }

  return {
    isFetching,
    fetch,
    elements,
    total,
    page,
    itemsPerPage,
    pageCount,
  };
}
