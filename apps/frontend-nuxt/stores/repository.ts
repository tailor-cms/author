import { repository as api, tag as tagApi } from '@/api';
import type {
  Repository,
  RepositoryUser,
  Tag,
} from '@/api/interfaces/repository';
import repositoryFilterConfigs from '~/components/catalog/Filter/repositoryFilterConfigs';
import { useAuthStore } from './auth';

const getDefaultQueryParams = () => ({
  offset: 0,
  limit: 18,
  search: '',
  sortBy: {
    field: 'updatedAt',
    direction: 'DESC',
  },
  pinned: false,
  filter: [] as any[],
});

export const useRepositoryStore = defineStore('repositories', () => {
  const authStore = useAuthStore();

  const $items = reactive(new Map<string, Repository>());
  const items = computed(() => Array.from($items.values()));
  const $tags = reactive(new Map<string, Tag>());
  const tags = computed(() => Array.from($tags.values()));

  const areAllItemsFetched = ref(false);
  const queryParams = reactive(getDefaultQueryParams());

  const query = computed(() => {
    const { sortBy, pinned, filter, ...rest } = queryParams;
    const filters = filter.reduce((acc, { id, type }) => {
      const filterTypeConfig = repositoryFilterConfigs[type] as any;
      acc[filterTypeConfig.queryParam] ||= [];
      acc[filterTypeConfig.queryParam].push(id);
      return acc;
    }, {} as any);
    return {
      ...rest,
      sortBy: sortBy.field,
      sortOrder: sortBy.direction,
      ...filters,
      ...{
        pinned: pinned || undefined,
      },
    };
  });

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
    const {
      items: repositories,
      total,
    }: { items: Repository[]; total: number } = await api.getRepositories(
      query.value,
    );
    if (query.value.offset === 0) $items.clear();
    repositories.forEach((it) => add(it));
    areAllItemsFetched.value = total <= query.value.offset + query.value.limit;
    return repositories;
  }

  async function get(id: number): Promise<Repository> {
    const repository: Repository = await api.get(id);
    add(repository);
    return repository;
  }

  const create = ({
    schema,
    name,
    description,
  }: {
    schema: string;
    name: string;
    description: string;
  }) => {
    return api.create({ schema, name, description });
  };

  async function update(payload: any): Promise<Repository | undefined> {
    const repository = findById(payload.id);
    if (!repository) return;
    const { id, ...rest } = payload;
    const updatedRepository = await api.patch(id, rest);
    Object.assign(repository, updatedRepository);
    return repository;
  }

  function remove(id: number): Promise<any> {
    return api.remove(id);
  }

  const clone = (id: number, name: string, description: string) => {
    return api.clone(id, name, description);
  };

  async function fetchTags(opts = { associated: true }) {
    const tags: Tag[] = await tagApi.fetch(opts);
    tags.forEach((it) => $tags.set(it.uid, it));
  }

  async function addTag(repositoryId: number, name: string) {
    const addedTag = await api.addTag({ repositoryId, name });
    const repository = findById(repositoryId);
    if (!repository) throw new Error('Repository not found!');
    if (!tags.value.find((it) => it.id === addedTag.id))
      $tags.set(addedTag.uid, addedTag);
    if (!repository.tags.find((it) => it.id === addedTag.id))
      repository.tags = [...repository.tags, addedTag];
  }

  async function removeTag(repositoryId: number, tagId: number) {
    await api.removeTag({ repositoryId, tagId });
    const repository = findById(repositoryId);
    if (!repository) throw new Error('Repository not found!');
    repository.tags = repository.tags.filter((it) => it.id !== tagId);
    if (!queryParams.filter.find((item: any) => item.id === tagId)) return;
    queryParams.offset = 0;
    await fetch();
  }

  async function pin({ id, pin }: { id: number; pin: boolean }) {
    const repositoryUser: RepositoryUser = await api.pin(id, pin);
    const repository = findById(id);
    if (!repository) throw new Error('Repository not found!');
    $items.set(repository.uid, { ...repository, repositoryUser });
    return repositoryUser;
  }

  function $reset() {
    $items.clear();
    $tags.clear();
    areAllItemsFetched.value = false;
    resetQueryParams();
  }

  function resetQueryParams() {
    Object.assign(queryParams, getDefaultQueryParams());
    areAllItemsFetched.value = false;
  }

  function resetPaginationParams() {
    queryParams.offset = 0;
    areAllItemsFetched.value = false;
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
    areAllItemsFetched,
    $tags,
    tags,
    findById,
    add,
    get,
    fetch,
    create,
    update,
    remove,
    clone,
    queryParams,
    resetQueryParams,
    resetPaginationParams,
    fetchTags,
    addTag,
    removeTag,
    pin,
    $reset,
  };
});
