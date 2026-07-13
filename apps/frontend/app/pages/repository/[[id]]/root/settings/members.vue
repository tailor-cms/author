<template>
  <VLayout class="members-page h-100">
    <VMain class="members-main">
      <VContainer class="members-content px-md-10 py-md-8" max-width="1400">
        <div class="d-flex align-center ga-3 mb-4">
          <VHover>
            <template #default="{ props: hoverProps }">
              <VTextField
                v-bind="hoverProps"
                v-model="search"
                bg-color="transparent"
                class="members-search"
                density="comfortable"
                min-width="220"
                placeholder="Search members..."
                prepend-inner-icon="mdi-magnify"
                rounded="xl"
                variant="solo-filled"
                clearable
                hide-details
                flat
                @click:clear="search = ''"
              />
            </template>
          </VHover>
          <VMenu location="bottom end">
            <template #activator="{ props: menuProps }">
              <VBtn
                v-bind="menuProps"
                :text="activeSortLabel"
                append-icon="mdi-chevron-down"
                class="sort-btn"
                prepend-icon="mdi-sort-variant"
                rounded="lg"
                size="small"
                variant="text"
              />
            </template>
            <VList density="compact" nav>
              <VListSubheader>Sort by</VListSubheader>
              <VListItem
                v-for="option in USER_SORT_OPTIONS"
                :key="`${option.key}-${option.order}`"
                :active="isActiveSort(option)"
                :prepend-icon="isActiveSort(option) ? 'mdi-check' : 'mdi-blank'"
                :title="option.title"
                @click="sort = { key: option.key, order: option.order }"
              />
            </VList>
          </VMenu>
          <VSpacer />
          <AddUserDialog :roles="roles" />
        </div>
        <UserList :roles="roles" :users="filteredUsers" />
      </VContainer>
    </VMain>
  </VLayout>
</template>

<script lang="ts" setup>
import { map, orderBy } from 'lodash-es';
import { role, type RepositoryRole } from '@tailor-cms/interfaces/role';
import { storeToRefs } from 'pinia';
import { titleCase } from '@tailor-cms/utils';

import AddUserDialog from
  '@/components/repository/Settings/UserManagement/AddUserDialog.vue';
import UserList from
  '@/components/repository/Settings/UserManagement/UserList.vue';
import { useCurrentRepository } from '@/stores/current-repository';

interface Role {
  title: string;
  value: RepositoryRole;
  description?: string;
}

type SortOrder = 'asc' | 'desc';
interface SortOption {
  key: string;
  order: SortOrder;
  title: string;
}

const ROLE_DESCRIPTIONS = {
  ADMIN: `Full access. Edit content, manage users and groups, publish, and
    delete the repository.`,
  AUTHOR: `Edit content and structure. Cannot manage access or delete the
    repository.`,
};

const USER_SORT_OPTIONS: SortOption[] = [
  { key: 'label', order: 'asc', title: 'Name (A–Z)' },
  { key: 'label', order: 'desc', title: 'Name (Z–A)' },
  { key: 'repositoryRole', order: 'asc', title: 'Role' },
];

definePageMeta({
  name: 'repository-settings-members',
});

const store = useCurrentRepository();
const { users } = storeToRefs(store);

onMounted(() => store.getUsers());

const search = ref('');
const sort = ref<{ key: string; order: SortOrder }>({
  key: USER_SORT_OPTIONS[0]!.key,
  order: USER_SORT_OPTIONS[0]!.order,
});

const roles = computed<Role[]>(() =>
  map(role.repository, (value) => ({
    title: titleCase(value),
    value,
    description: ROLE_DESCRIPTIONS[value],
  })),
);

const isActiveSort = (option: SortOption) =>
  sort.value.key === option.key && sort.value.order === option.order;

const activeSortLabel = computed(
  () => USER_SORT_OPTIONS.find(isActiveSort)?.title ?? 'Sort',
);

const matchesSearch = (haystack: string) => {
  const term = search.value.trim().toLowerCase();
  if (!term) return true;
  return haystack.toLowerCase().includes(term);
};

const filteredUsers = computed(() => {
  const list = users.value.filter((u) =>
    matchesSearch(`${u.label ?? ''} ${u.email ?? ''} ${u.fullName ?? ''}`),
  );
  return orderBy(list, [sort.value.key], [sort.value.order]);
});
</script>

<style lang="scss" scoped>
.members-main {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
}

.members-content {
  text-align: left;
}

.members-search {
  max-width: 18rem;

  :deep(.v-field__outline) {
    display: none;
  }
}

.sort-btn {
  opacity: 0.85;

  &:hover {
    opacity: 1;
  }
}
</style>
