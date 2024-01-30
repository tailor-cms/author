import type { Repository, RepositoryUser } from '@/api/interfaces/repository';

import { repository as api } from '@/api';
import { useAuthStore } from './auth';

export const useRepositoryStore = defineStore('repositories', () => {
  const authStore = useAuthStore();

  const $items = reactive(new Map<string, Repository>());
  const items = computed(() => Array.from($items.values()));

  async function fetch(): Promise<Repository[]> {
    const repositories: Repository[] = await api.getRepositories();
    repositories.forEach((it) => add(it));
    return repositories;
  }

  function add(item: Repository) {
    processRepository(item);
    $items.set(item.uid, item);
    return item;
  }

  async function pin({ id, pin }: { id: number; pin: boolean }) {
    const repositoryUser = (await api.pin(id, pin)) as RepositoryUser;
    const repository = items.value.find((it) => it.id === id);
    if (!repository) throw new Error('Repository not found!');
    $items.set(repository.uid, { ...repository, repositoryUser });
    return repositoryUser;
  }

  function $reset() {
    $items.clear();
  }

  function processRepository(repository: Repository) {
    repository.lastChange = repository.revisions[0];
    repository.repositoryUser = repository.repositoryUsers?.[0];
    // If repository or global admin
    repository.hasAdminAccess =
      authStore.isAdmin || repository.repositoryUser?.role === 'ADMIN';
  }

  return {
    $items,
    items,
    pin,
    add,
    fetch,
    $reset,
  };
});
