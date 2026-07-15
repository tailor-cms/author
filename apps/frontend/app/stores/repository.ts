import type { Repository, Tag } from '@tailor-cms/interfaces/repository';
import type {
  RepositoryCreateReq,
  RepositoryUpdateReq,
} from '@tailor-cms/api-client';
import { register as registerSchema } from '@tailor-cms/config';
import { hasRepositoryAdminAccess } from '@tailor-cms/utils';

import { useAuthStore } from './auth';
import { api } from '@/api';

export type SortField = 'name' | 'description' | 'createdAt' | 'updatedAt';
export type SortDirection = 'ASC' | 'DESC';

export type RepositoryFilter =
| { type: 'TAG'; id: number }
| { type: 'SCHEMA'; id: string };

type FilterQuery = { tagIds?: number[]; schemas?: string[] };

const getDefaultQueryParams = () => ({
  offset: 0,
  limit: 18,
  search: '',
  sortBy: {
    field: 'updatedAt' as SortField,
    direction: 'DESC' as SortDirection,
  },
  pinned: false,
  filter: [] as RepositoryFilter[],
});

export const useRepositoryStore = defineStore('repositories', () => {
  const authStore = useAuthStore();

  const $items = reactive(new Map<string, Repository>());
  const items = computed(() => Array.from($items.values()));
  const $tags = reactive(new Map<string, Tag>());
  const tags = computed(() => Array.from($tags.values()));

  const areAllItemsFetched = ref(false);
  const queryParams = reactive(getDefaultQueryParams());

  const userGroupOptions = computed(() => [
    { id: 0, name: 'All workspaces' },
    ...authStore.userGroups,
  ]);
  const selectedUserGroupId = ref<number>(userGroupOptions.value[0]!.id);

  const query = computed(() => {
    const { sortBy, pinned, filter, ...rest } = queryParams;
    const filters = filter.reduce<FilterQuery>((acc, f) => {
      if (f.type === 'TAG') (acc.tagIds ??= []).push(f.id);
      else (acc.schemas ??= []).push(f.id);
      return acc;
    }, {});
    return {
      ...rest,
      sortBy: sortBy.field,
      sortOrder: sortBy.direction,
      ...filters,
      ...{
        pinned: pinned || undefined,
        userGroupId: selectedUserGroupId.value || undefined,
      },
    };
  });

  function findById(id: number | string) {
    if (typeof id === 'string') return $items.get(id);
    return items.value.find((it) => it.id === id);
  }

  function add(item: Repository) {
    processRepository(item);
    // Make any schema snapshot the BE shipped resolvable through the
    // standard `schema.getXxx(...)` API. `Repository.data.$$` is the
    // platform-managed namespace that carries the snapshot.
    const snapshotConfig = item.data?.$$?.schema?.config;
    if (snapshotConfig) registerSchema(snapshotConfig);
    $items.set(item.uid, item);
    return item;
  }

  async function fetch(): Promise<Repository[]> {
    const { items: repositories, total } = await api.repository.list({
      query: query.value,
    });
    if (query.value.offset === 0) $items.clear();
    repositories.forEach((it) => add(it));
    areAllItemsFetched.value = total <= query.value.offset + query.value.limit;
    return repositories;
  }

  async function get(id: number): Promise<Repository> {
    const repository = await api.repository.get({
      params: { repositoryId: id },
    });
    add(repository);
    return repository;
  }

  const create = (payload: RepositoryCreateReq['body']): Promise<Repository> =>
    api.repository.create({ body: payload });

  async function update(
    payload: RepositoryUpdateReq['body'] & { id: number },
  ): Promise<Repository | undefined> {
    const repository = findById(payload.id);
    if (!repository) return;
    const { id, ...body } = payload;
    const updated = await api.repository.update({
      params: { repositoryId: id },
      body,
    });
    Object.assign(repository, updated);
    return repository;
  }

  async function remove(id: number): Promise<void> {
    await api.repository.delete({ params: { repositoryId: id } });
  }

  const clone = (
    id: number,
    name: string,
    description: string,
    shareWithSamePeople = false,
  ) =>
    api.repository.clone({
      params: { repositoryId: id },
      body: { name, description, shareWithSamePeople },
    });

  async function fetchTags(
    opts: { associated?: boolean } = { associated: true },
  ) {
    const fetchedTags = await api.tag.list({ query: opts });
    fetchedTags.forEach((it) => $tags.set(it.uid, it));
  }

  async function addTag(repositoryId: number, name: string) {
    const addedTag = await api.repository.addTag({
      params: { repositoryId },
      body: { name },
    });
    const repository = findById(repositoryId);
    if (!repository) throw new Error('Repository not found!');
    if (!tags.value.find((it) => it.id === addedTag.id))
      $tags.set(addedTag.uid, addedTag);
    const existingTags = repository.tags ?? [];
    if (!existingTags.find((it) => it.id === addedTag.id))
      repository.tags = [...existingTags, addedTag];
  }

  async function removeTag(repositoryId: number, tagId: number) {
    await api.repository.removeTag({ params: { repositoryId, tagId } });
    const repository = findById(repositoryId);
    if (!repository) throw new Error('Repository not found!');
    repository.tags = (repository.tags ?? []).filter((it) => it.id !== tagId);
    if (!queryParams.filter.find((item) => item.id === tagId)) return;
    queryParams.offset = 0;
    await fetch();
  }

  async function pin({ id, pin }: { id: number; pin: boolean }) {
    const repositoryUser = await api.repository.pin({
      params: { repositoryId: id },
      body: { pin },
    });
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
    repository.lastChange = repository.revisions![0];
    // Must be derived before resolving the policy below, which reads
    // the acting user's membership from `repository.repositoryUser`
    repository.repositoryUser = repository.repositoryUsers?.[0];
    const accessPolicy = authStore.getRepositoryAccess(repository);
    repository.accessPolicy = accessPolicy;
    repository.hasAdminAccess = hasRepositoryAdminAccess(accessPolicy);
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
    userGroupOptions,
    selectedUserGroupId,
    resetQueryParams,
    resetPaginationParams,
    fetchTags,
    addTag,
    removeTag,
    pin,
    $reset,
  };
});
