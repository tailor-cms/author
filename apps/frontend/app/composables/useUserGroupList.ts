import type { InjectionKey } from 'vue';

import { api } from '@/api';
import type { UserGroupRow } from '@/components/admin/UserGroupList/types';

const PAGE_SIZE = 24;

type SortOrder = 'asc' | 'desc';

/**
 * Searchable, sortable user group list that grows page by page; shared
 * between the admin groups sidebar and the group pages next to it.
 */
function createUserGroupList() {
  const items = ref<UserGroupRow[]>([]);
  const total = ref(0);
  const search = ref('');
  const sortOrder = ref<SortOrder>('asc');
  const isLoading = ref(true);

  const hasMore = computed(() => items.value.length < total.value);

  const fetchPage = (offset: number, limit: number) =>
    api.userGroup.list({
      query: {
        sortBy: 'name',
        sortOrder: sortOrder.value === 'desc' ? 'DESC' : 'ASC',
        offset,
        limit,
        filter: search.value,
      },
    });

  // Reloads everything shown so far, e.g. after counts or names change
  const refresh = async () => {
    isLoading.value = true;
    const limit = Math.max(items.value.length, PAGE_SIZE);
    const result = await fetchPage(0, limit);
    items.value = result.items;
    total.value = result.total;
    isLoading.value = false;
  };

  const reset = () => {
    items.value = [];
    return refresh();
  };

  const loadMore = async () => {
    isLoading.value = true;
    const result = await fetchPage(items.value.length, PAGE_SIZE);
    items.value = [...items.value, ...result.items];
    total.value = result.total;
    isLoading.value = false;
  };

  watch([search, sortOrder], reset);

  return {
    items,
    total,
    search,
    sortOrder,
    isLoading,
    hasMore,
    refresh,
    reset,
    loadMore,
  };
}

type UserGroupList = ReturnType<typeof createUserGroupList> & {
  openCreateDialog: () => void;
};

const USER_GROUP_LIST: InjectionKey<UserGroupList> = Symbol('userGroupList');

export function provideUserGroupList(openCreateDialog: () => void) {
  const list = { ...createUserGroupList(), openCreateDialog };
  provide(USER_GROUP_LIST, list);
  return list;
}

export function useUserGroupList() {
  const list = inject(USER_GROUP_LIST);
  if (!list) throw new Error('User group list is not provided');
  return list;
}
