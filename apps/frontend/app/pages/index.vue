<template>
  <NuxtLayout name="main">
    <VSheet
      class="h-100 mx-3"
      color="surface-canvas"
      rounded="t-xl"
      border
    >
      <div class="catalog-scroll">
        <VContainer class="catalog" max-width="1360">
          <VRow
            v-if="!isEmptyCatalog"
            class="catalog-actions py-10"
            density="compact"
          >
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
              <VBtn
                v-tooltip:top="{
                  text: arePinnedShown ? 'Show all' : 'Show pinned',
                  openDelay: 400,
                }"
                :color="arePinnedShown ? 'tertiary' : '' "
                :icon="arePinnedShown ? 'mdi-pin mdi-rotate-45' : 'mdi-pin'"
                aria-label="Toggle pinned items filter"
                class="text-medium-emphasis my-1"
                variant="tonal"
                @click="togglePinFilter"
              />
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
          <BulkActionBar
            :count="selectedRepos.size"
            :is-all-selected="isAllSelected"
            :is-deleting="isDeleting"
            @clear="selectedRepos.clear()"
            @toggle-all="toggleSelectAll"
            @delete="deleteSelected"
          />
          <CloneModal
            v-if="cloneTarget"
            :repository="cloneTarget"
            @cloned="refetchRepositories"
            @close="cloneTarget = null"
          />
          <ExportDialog
            v-if="exportTarget"
            :repository="exportTarget"
            @close="exportTarget = null"
          />
          <ProgressDialog
            :show="publishUtils.isPublishing.value"
            :status="publishUtils.status.value.progress * 100"
          />
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
                  @clone="onCardClone"
                  @publish="onCardPublish"
                  @export="onCardExport"
                  @delete="deleteRepository"
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
          <CatalogEmptyState
            v-else-if="hasEmptyStateActions"
            class="mt-8"
            @created="onRepositoryAdd"
          />
          <TailorEmptyState
            v-else-if="emptyState"
            :action-text="hasSearchOrFilter ? 'Clear search & filters' : undefined"
            :icon="emptyState.icon"
            :text="emptyState.text"
            :title="emptyState.title"
            @click:action="clearSearchAndFilters"
          />
        </VContainer>
      </div>
    </VSheet>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { Repository } from '@tailor-cms/interfaces/repository';

import { find, map, upperFirst } from 'lodash-es';
import { SCHEMAS, schema as schemaApi } from '@tailor-cms/config';
import { TailorEmptyState } from '@tailor-cms/core-components';
import { storeToRefs } from 'pinia';
import pluralize from 'pluralize-esm';
import Promise from 'bluebird';

import AddRepository from '@/components/catalog/AddRepository/index.vue';
import BulkActionBar from '@/components/catalog/BulkActionBar.vue';
import CatalogEmptyState from '@/components/catalog/EmptyState/index.vue';
import CloneModal from '@/components/repository/Settings/CloneModal.vue';
import ExportDialog from '@/components/repository/Settings/ExportModal.vue';
import ProgressDialog from '@/components/common/ProgressDialog.vue';
import RepositoryCard from '@/components/catalog/Card/index.vue';
import RepositoryFilter from '~/components/catalog/Filter/RepositoryFilter.vue';
import repositoryFilterConfigs from '~/components/catalog/Filter/repositoryFilterConfigs';
import RepositoryFilterSelection
  from '@/components/catalog/Filter/RepositoryFilterSelection/index.vue';
import SearchInput from '@/components/catalog/Filter/SearchInput.vue';
import SelectOrder from '@/components/catalog/Filter/SelectOrder.vue';
import UserGroupSelect from '@/components/catalog/Filter/UserGroupSelect.vue';
import { describeSelection } from '@/utils/describeSelection';
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

const publishUtils = useCatalogPublish();
const confirmationDialog = useConfirmationDialog();
const notify = useNotification();

const isLoading = ref(true);
const isDeleting = ref(false);
const cloneTarget = ref<Repository | null>(null);
const exportTarget = ref<Repository | null>(null);
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

// Bulk selection drives bulk delete, so only repositories the user can
// administer are selectable (the card hides the checkbox for the rest).
const selectableRepositories = computed(() =>
  repositories.value.filter((it) => it.hasAdminAccess),
);

const isAllSelected = computed(() =>
  selectableRepositories.value.length > 0 &&
  selectedRepos.value.size === selectableRepositories.value.length,
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
  selectedRepos.value = new Set(
    selectableRepositories.value.map((repo) => repo.id),
  );
};

const deleteSelected = () => {
  const selected = repositories.value.filter((it) =>
    selectedRepos.value.has(it.id),
  );
  const { count, label, noun, verb } = describeSelection(
    selected.map((it) => schemaApi.getLabel(it)),
  );
  const target = count === 1 ? `${noun} "${selected[0]!.name}"` : noun;

  confirmationDialog({
    title: `Delete ${pluralize(label, count)}?`,
    color: 'error',
    message: `Are you sure you want to delete ${target}?`,
    action: async () => {
      isDeleting.value = true;
      try {
        await Promise.each(selected, ({ id }: Repository) =>
          repositoryStore.remove(id),
        );
        notify(`${upperFirst(noun)} ${verb} been deleted`, { immediate: true });
      } catch {
        notify(`We couldn't delete the selected ${pluralize(label)}`, {
          color: 'error',
        });
      } finally {
        selectedRepos.value.clear();
        await refetchRepositories();
        isDeleting.value = false;
      }
    },
  });
};

const onCardClone = (repository: Repository) => {
  cloneTarget.value = repository;
};

const onCardExport = (repository: Repository) => {
  exportTarget.value = repository;
};

const onCardPublish = (repository: Repository) => {
  publishUtils.publishRepository(repository, refetchRepositories);
};

const deleteRepository = (repository: Repository) => {
  const type = schemaApi.getLabel(repository);
  confirmationDialog({
    title: `Delete ${type}?`,
    color: 'error',
    message: `Are you sure you want to delete the ${type} "${repository.name}"?`,
    action: async () => {
      try {
        await repositoryStore.remove(repository.id);
        notify(`The ${type} has been deleted`, { immediate: true });
        await refetchRepositories();
      } catch {
        notify(`We couldn't delete the ${type}`, { color: 'error' });
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

const hasSearchOrFilter = computed(
  () => !!queryParams.value.search || queryParams.value.filter.length > 0,
);

const hasAnyQueryConstraint = computed(
  () => hasSearchOrFilter.value || arePinnedShown.value,
);

const clearSearchAndFilters = async () => {
  selectedRepos.value.clear();
  queryParams.value.search = '';
  queryParams.value.filter = [];
  queryParams.value.pinned = false;
  await refetchRepositories();
};

// True whenever the catalog holds no repositories at all (no active
// search/pin/filter), regardless of the user's create access.
const isEmptyCatalog = computed(
  () =>
    !isLoading.value &&
    !hasRepositories.value &&
    !hasAnyQueryConstraint.value,
);

const hasEmptyStateActions = computed(
  () => isEmptyCatalog.value && authStore.hasCreateRepositoryAccess,
);

const emptyState = computed(() => {
  if (isLoading.value || hasRepositories.value) return null;
  if (hasSearchOrFilter.value) {
    return {
      icon: 'mdi-magnify-close',
      title: 'No matches',
      text: 'No repositories match your search or filters.',
    };
  }
  if (arePinnedShown.value) {
    return {
      icon: 'mdi-pin-outline',
      title: 'No pinned repositories',
      text: 'Pin a repository to keep it close at hand here.',
    };
  }
  if (!authStore.hasCreateRepositoryAccess) {
    return {
      icon: 'mdi-folder-open-outline',
      title: 'No repositories yet',
      text: 'No repositories have been shared with you yet.',
    };
  }
  return null;
});

onBeforeMount(async () => {
  // Refetch user info to get the latest permissions
  authStore.fetchUserInfo();
  // Coming back to the catalog, reset pagination so the fetch restarts from
  // the first page
  repositoryStore.resetPaginationParams();
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
