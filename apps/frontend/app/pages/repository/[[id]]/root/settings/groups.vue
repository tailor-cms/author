<template>
  <VLayout class="groups-page h-100">
    <VMain class="groups-main">
      <VContainer class="groups-content px-md-10 py-md-8" max-width="1200">
        <div class="d-flex align-center ga-3 mb-4">
          <VHover>
            <template #default="{ props: hoverProps }">
              <VTextField
                v-bind="hoverProps"
                v-model="search"
                bg-color="transparent"
                class="groups-search"
                density="comfortable"
                min-width="220"
                placeholder="Search groups..."
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
                v-for="option in GROUP_SORT_OPTIONS"
                :key="`${option.key}-${option.order}`"
                :active="isActiveSort(option)"
                :prepend-icon="isActiveSort(option) ? 'mdi-check' : 'mdi-blank'"
                :title="option.title"
                @click="sort = { key: option.key, order: option.order }"
              />
            </VList>
          </VMenu>
          <VSpacer />
          <AddUserGroup
            :user-groups="(repository?.userGroups as UserGroup[]) ?? []"
          />
        </div>
        <UserGroupList :groups="filteredGroups" />
      </VContainer>
    </VMain>
  </VLayout>
</template>

<script lang="ts" setup>
import { orderBy } from 'lodash-es';
import { storeToRefs } from 'pinia';
import type { UserGroup } from '@tailor-cms/interfaces/user-group';

import AddUserGroup from
  '@/components/repository/Settings/UserManagement/AddUserGroup.vue';
import UserGroupList from
  '@/components/repository/Settings/UserManagement/UserGroupList.vue';
import { useCurrentRepository } from '@/stores/current-repository';

type SortOrder = 'asc' | 'desc';
interface SortOption {
  key: string;
  order: SortOrder;
  title: string;
}

const GROUP_SORT_OPTIONS: SortOption[] = [
  { key: 'name', order: 'asc', title: 'Name (A–Z)' },
  { key: 'name', order: 'desc', title: 'Name (Z–A)' },
];

definePageMeta({
  name: 'repository-settings-groups',
});

const store = useCurrentRepository();
const { repository } = storeToRefs(store);

const search = ref('');
const sort = ref<{ key: string; order: SortOrder }>({
  key: GROUP_SORT_OPTIONS[0]!.key,
  order: GROUP_SORT_OPTIONS[0]!.order,
});

const groups = computed<UserGroup[]>(
  () => (repository.value?.userGroups as UserGroup[]) ?? [],
);

const isActiveSort = (option: SortOption) =>
  sort.value.key === option.key && sort.value.order === option.order;

const activeSortLabel = computed(
  () => GROUP_SORT_OPTIONS.find(isActiveSort)?.title ?? 'Sort',
);

const matchesSearch = (haystack: string) => {
  const term = search.value.trim().toLowerCase();
  if (!term) return true;
  return haystack.toLowerCase().includes(term);
};

const filteredGroups = computed(() => {
  const list = groups.value.filter((g) => matchesSearch(g.name ?? ''));
  return orderBy(list, [sort.value.key], [sort.value.order]);
});
</script>

<style lang="scss" scoped>
.groups-main {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
}

.groups-content {
  text-align: left;
}

.groups-search {
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
