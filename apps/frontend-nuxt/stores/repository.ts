import type {
  Repository,
  RepositoryUser,
  Tag,
} from '@/api/interfaces/repository';

import { repository as api } from '@/api';
import { useAuthStore } from './auth';

export const useRepositoryStore = defineStore('repositories', () => {
  const authStore = useAuthStore();

  const $items = reactive(new Map<string, Repository>());
  const items = computed(() => Array.from($items.values()));
  const tags = reactive([] as Tag[]);

  function findById(id: number | string) {
    if (typeof id === 'string') return $items.get(id);
    return items.value.find((it) => it.id === id);
  }

  function add(item: Repository) {
    processRepository(item);
    $items.set(item.uid, item);
    return item;
  }

  async function fetch(): Promise<Repository[]> {
    const repositories: Repository[] = await api.getRepositories();
    repositories.forEach((it) => add(it));
    return repositories;
  }

  async function pin({ id, pin }: { id: number; pin: boolean }) {
    const repositoryUser = (await api.pin(id, pin)) as RepositoryUser;
    const repository = items.value.find((it) => it.id === id);
    if (!repository) throw new Error('Repository not found!');
    $items.set(repository.uid, { ...repository, repositoryUser });
    return repositoryUser;
  }

  async function addTag(repositoryId: number, name: string) {
    const addedTag = await api.addTag({ repositoryId, name });
    const repository = findById(repositoryId);
    if (!repository) throw new Error('Repository not found!');
    if (!tags.find((it) => it.id === addedTag.id)) tags.push(addedTag);
    if (!repository.tags.find((it) => it.id === addedTag.id))
      repository.tags = [...repository.tags, addedTag];
  }

  async function removeTag(repositoryId: number, tagId: number) {
    await api.removeTag({ repositoryId, tagId });
    const repository = findById(repositoryId);
    if (!repository) throw new Error('Repository not found!');
    repository.tags = repository.tags.filter((it) => it.id !== tagId);
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
    findById,
    add,
    fetch,
    pin,
    addTag,
    removeTag,
    $reset,
  };
});
