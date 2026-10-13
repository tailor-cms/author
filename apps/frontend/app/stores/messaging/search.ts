import type { MessageSearchHit } from '@tailor-cms/api-client';

import {
  extractMentions,
  extractReferences,
  extractText,
} from '@tailor-cms/utils';
import { api } from '@/api';

/**
 * Message search.
 *
 * The query arrives in the same token format a message is written in,
 * so `@` and `#` picked from the composer's autocomplete become
 * structured filters rather than literal text.
 */
export const createSearch = () => {
  const searchQuery = ref('');
  const searchHits = ref<MessageSearchHit[]>([]);
  const searchTotal = ref(0);
  const isSearching = ref(false);

  function clearSearch() {
    searchQuery.value = '';
    searchHits.value = [];
    searchTotal.value = 0;
  }

  async function search(repositoryId: number, query: string) {
    searchQuery.value = query;
    const q = extractText(query);
    const mentions = extractMentions(query).map((it) => it.userId);
    const references = extractReferences(query).map(
      (it) => `${it.entityType}:${it.entityId}`,
    );
    if (!q && !mentions.length && !references.length) {
      searchHits.value = [];
      searchTotal.value = 0;
      return;
    }
    isSearching.value = true;
    try {
      const result = await api.messaging.searchMessages({
        params: { repositoryId },
        query: { q: q || undefined, mentions, references } as any,
      });
      searchHits.value = result.items;
      searchTotal.value = result.total;
    } finally {
      isSearching.value = false;
    }
  }

  return {
    searchQuery,
    searchHits,
    searchTotal,
    isSearching,
    search,
    clearSearch,
  };
};
