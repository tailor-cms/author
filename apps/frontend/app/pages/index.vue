<template>
  <NuxtLayout name="main">
    <VSheet
      class="catalog-scroll mx-3"
      color="surface-container-low"
      rounded="t-xl"
      border
    >
      <VContainer class="catalog" max-width="1360">
        <VRow class="catalog-actions py-10" density="compact">
          <VCol cols="12" lg="4" md="6">
            <UserGroupSelect
              v-if="userGroupOptions.length"
              v-model="repositoryStore.selectedUserGroupId"
              :items="userGroupOptions"
              @update:model-value="onUserGroupChange"
            />
          </VCol>
          <VCol cols="12" lg="4" md="6">
            <SearchInput
              :search-input="repositoryStore.queryParams.search"
              @update="onSearchInput"
            />
          </VCol>
          <VCol
            class="d-flex justify-end align-bottom pl-2 text-sm-left"
            cols="12"
            lg="4"
          >
            <VTooltip location="top" open-delay="400">
              <template #activator="{ props: tooltipProps }">
                <VBtn
                  v-bind="tooltipProps"
                  :color="arePinnedShown ? 'highlight' : '' "
                  :icon="arePinnedShown ? 'mdi-pin mdi-rotate-45' : 'mdi-pin'"
                  aria-label="Toggle pinned items filter"
                  class="text-medium-emphasis my-1"
                  variant="tonal"
                  @click="togglePinFilter"
                />
              </template>
              <span>{{ arePinnedShown ? 'Show all' : 'Show pinned' }}</span>
            </VTooltip>
            <SelectOrder
              :sort-by="queryParams.sortBy"
              class="pl-2"
              @update="updateSort"
            />
            <span class="py-1">
              <RepositoryFilter
                v-for="filter in filters"
                :key="filter.type"
                v-bind="filter"
                @update="onFilterChange"
              />
            </span>
            <span class="my-2 ml-5">
              <AddRepository
                :is-create-enabled="authStore.isAdmin || authStore.isDefaultUser"
                @created="onRepositoryAdd"
              />
            </span>
          </VCol>
        </VRow>
        <RepositoryFilterSelection
          @clear:all="(queryParams.filter = []) && refetchRepositories()"
          @close="onFilterChange"
        />
        <VExpandTransition>
          <div v-if="selectedRepos.size > 0" class="d-flex align-center mb-4 text-left">
            <VTooltip location="top" open-delay="400">
              <template #activator="{ props: tooltipProps }">
                <VCheckbox
                  v-bind="tooltipProps"
                  :disabled="!repositories.length"
                  :model-value="isAllSelected"
                  :indeterminate="someSelected"
                  label="Select all"
                  hide-details
                  @update:model-value="toggleSelectAll"
                />
              </template>
              <span>{{ isAllSelected ? 'Deselect all' : 'Select all' }}</span>
            </VTooltip>
            <VBtn
              :disabled="selectedRepos.size === 0"
              :text="`Delete (${selectedRepos.size})`"
              class="ml-4"
              color="error"
              prepend-icon="mdi-trash-can-outline"
              variant="tonal"
              @click="deleteSelected"
            />
          </div>
        </VExpandTransition>
        <VInfiniteScroll
          v-if="!isLoading && hasRepositories"
          class="d-flex ma-0 pa-0"
          empty-text=""
          mode="manual"
          @load="loadMore"
        >
          <VRow>
            <VCol
              v-for="repository in repositoryStore.items"
              :key="repository.uid"
              cols="12"
              lg="4"
              md="6"
            >
              <RepositoryCard
                :is-selected="selectedRepos.has(repository.id)"
                :repository="repository"
                @toggle-selection="toggleSelection"
              />
            </VCol>
          </VRow>
          <template #load-more="{ props: loadProps }">
            <VBtn
              v-if="!areAllItemsFetched"
              v-bind="loadProps"
              text="Load more"
              variant="tonal"
            />
          </template>
        </VInfiniteScroll>
        <VAlert
          v-else-if="noRepositoriesMessage"
          :text="noRepositoriesMessage"
          class="mt-4"
          icon="mdi-alert-circle-outline"
          rounded="lg"
          variant="tonal"
          prominent
        />
      </VContainer>
    </VSheet>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { find, map } from 'lodash-es';
import { SCHEMAS } from '@tailor-cms/config';
import { storeToRefs } from 'pinia';
import pluralize from 'pluralize-esm';
import Promise from 'bluebird';

import AddRepository from '@/components/catalog/AddRepository/index.vue';
import RepositoryCard from '@/components/catalog/Card/index.vue';
import RepositoryFilter from '~/components/catalog/Filter/RepositoryFilter.vue';
import repositoryFilterConfigs from '~/components/catalog/Filter/repositoryFilterConfigs';
import RepositoryFilterSelection
  from '@/components/catalog/Filter/RepositoryFilterSelection/index.vue';
import SearchInput from '@/components/catalog/Filter/SearchInput.vue';
import SelectOrder from '@/components/catalog/Filter/SelectOrder.vue';
import UserGroupSelect from '@/components/catalog/Filter/UserGroupSelect.vue';
import { useAuthStore } from '@/stores/auth';
import { useConfirmationDialog } from '@/composables/useConfirmationDialog';
import { useConfigStore } from '@/stores/config';
import { useRepositoryStore } from '@/stores/repository';

definePageMeta({
  name: 'catalog',
  middleware: ['auth'],
});

useHead({
  title: 'Catalog',
  meta: [{ name: 'description', content: 'Tailor CMS - Repository catalog' }],
});

const authStore = useAuthStore();
const repositoryStore = useRepositoryStore();
const config = useConfigStore();
const confirmationDialog = useConfirmationDialog();

const isLoading = ref(true);
const selectedRepos = ref<Set<number>>(new Set());

const {
  queryParams,
  items: repositories,
  tags,
  areAllItemsFetched,
} = storeToRefs(repositoryStore);

const hasRepositories = computed(() => !!repositories.value.length);
const arePinnedShown = computed(() => queryParams.value.pinned);
const userGroupOptions = computed(() =>
  authStore.userGroups.length ? repositoryStore.userGroupOptions : [],
);

const onUserGroupChange = async () => {
  selectedRepos.value.clear();
  repositoryStore.resetPaginationParams();
  await repositoryStore.fetch();
};
const isAllSelected = computed(() =>
  repositories.value.length > 0 &&
  selectedRepos.value.size === repositories.value.length,
);

const someSelected = computed(() =>
  selectedRepos.value.size > 0 &&
  selectedRepos.value.size < repositories.value.length,
);

const togglePinFilter = () => {
  queryParams.value.pinned = !arePinnedShown.value;
  refetchRepositories();
};

const toggleSelection = (id: number) => {
  if (selectedRepos.value.has(id)) return selectedRepos.value.delete(id);
  selectedRepos.value.add(id);
};

const toggleSelectAll = () => {
  if (isAllSelected.value) return selectedRepos.value.clear();
  selectedRepos.value = new Set(repositories.value.map((repo) => repo.id));
};

const deleteSelected = () => {
  const count = selectedRepos.value.size;

  confirmationDialog({
    title: `Delete ${pluralize('repository', count)}?`,
    message: `Are you sure you want to delete ${pluralize('repository', count, true)}?`,
    action: async () => {
      try {
        const repositories = Array.from(selectedRepos.value);
        await Promise.each(repositories, (id) => repositoryStore.remove(id));
      } finally {
        selectedRepos.value.clear();
        await refetchRepositories();
      }
    },
  });
};

const filters = computed(() => {
  const { SCHEMA, TAG } = repositoryFilterConfigs;
  const filters = [{ ...TAG, values: tags.value }];
  if (config.availableSchemas.length > 1) {
    filters.push({ ...SCHEMA, values: SCHEMAS as any[] });
  }
  return map(filters, ({ type, values, ...config }) => {
    values = map(values, (it) => {
      const isSelected = !!find(queryParams.value.filter, { id: it.id, type });
      return { ...it, type, isSelected };
    });
    return { type, values, ...config };
  });
});

const updateSort = (payload: any) => {
  selectedRepos.value.clear();
  queryParams.value.sortBy = {
    ...queryParams.value.sortBy,
    ...payload,
  };
  refetchRepositories();
};

const onSearchInput = (searchInput: string) => {
  selectedRepos.value.clear();
  queryParams.value.search = searchInput;
  refetchRepositories();
};

const onFilterChange = (payload: any) => {
  selectedRepos.value.clear();
  const { filter: catalogFilter } = queryParams.value;
  const existing = find(catalogFilter, { id: payload.id });
  if (!existing) queryParams.value.filter.push(payload);
  else
    queryParams.value.filter = catalogFilter.filter(
      (it: any) => it.id !== payload.id,
    );
  refetchRepositories();
};

const onRepositoryAdd = async () => {
  repositoryStore.resetQueryParams();
  await repositoryStore.fetch();
};

const refetchRepositories = async () => {
  isLoading.value = true;
  repositoryStore.resetPaginationParams();
  await repositoryStore.fetch();
  isLoading.value = false;
};

// eslint-disable-next-line
const loadMore = async ({ done }: { done: Function }) => {
  const totalItems = repositories.value.length;
  queryParams.value.offset = totalItems;
  await repositoryStore.fetch();
  const totalItemsAfter = repositories.value.length;
  const expectedItemCount = totalItems + queryParams.value.limit;
  const hasMore = expectedItemCount !== totalItemsAfter || !totalItemsAfter;
  const status = hasMore ? 'empty' : 'ok';
  // Infinite loader cb
  done(status);
};

const noRepositoriesMessage = computed(() => {
  if (isLoading.value) return;
  if (hasRepositories.value) return;
  if (queryParams.value.search) return 'No matches found';
  if (arePinnedShown.value) return '0 pinned items';
  return '0 available repositories';
});

onBeforeMount(async () => {
  // Refetch user info to get the latest permissions
  authStore.fetchUserInfo();
  // If the user is coming back to the catalog page, we need to make sure
  // that the store items are purged and fetched again
  // (in case the user has deleted a repository).
  repositoryStore.$items.clear();
  await repositoryStore.fetch();
  await repositoryStore.fetchTags();
  isLoading.value = false;
});
</script>

<style lang="scss" scoped>
.catalog-scroll {
  height: 100%;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.catalog-actions {
  position: relative;
  padding-top: 0.75rem;
}

.v-infinite-scroll {
  overflow-y: unset;
  overflow-x: unset;
}

:deep(.v-infinite-scroll__side) {
  > button {
    margin-top: 1.5rem;
  }

  .v-progress-circular {
    margin-top: 1.5rem;
  }
}
</style>
