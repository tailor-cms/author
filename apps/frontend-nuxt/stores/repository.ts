import type { Repository } from '@/api/interfaces/repository';

import { repository as api } from '@/api';

export const useRepositoryStore = defineStore('repositories', () => {
  const $items = reactive(new Map<string, Repository>());
  const items = computed(() => Array.from($items.values()));

  async function fetch(): Promise<void> {
    const repositories: Repository[] = await api.getRepositories();
    repositories.forEach((it) => add(it));
  }

  function add(item: Repository) {
    $items.set(item.uid, item);
  }

  function $reset() {
    $items.clear();
  }

  return {
    items,
    add,
    fetch,
    $reset,
  };
});
