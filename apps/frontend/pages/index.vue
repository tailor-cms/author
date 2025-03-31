<template>
  <NuxtLayout class="catalog-wrapper" name="main">
    <VContainer
      :class="{ 'catalog-empty': !hasRepositories, 'catalog': true }"
      max-width="1360"
    >
      <VRow class="catalog-actions pb-5" no-gutters>
        <VCol
          cols="12"
          lg="4"
          md="12"
          offset-lg="4"
          sm="12">
          <SearchInput
            :search-input="repositoryStore.queryParams.search"
            @update="onSearchInput"
          />
        </VCol>
        <VCol
          class="d-flex justify-end align-bottom pl-2 text-sm-left"
          cols="12"
          lg="4"
          md="12"
          sm="12"
        >
          <VTooltip
            content-class="bg-primary-darken-4"
            location="top"
            open-delay="400"
          >
            <template #activator="{ props: tooltipProps }">
              <VBtn
                v-bind="tooltipProps"
                :color="arePinnedShown ? 'lime-accent-3' : 'primary-lighten-3'"
                :icon="arePinnedShown ? 'mdi-pin mdi-rotate-45' : 'mdi-pin'"
                aria-label="Toggle pinned items filter"
                class="my-1"
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
      <VInfiniteScroll
        v-if="!isLoading && hasRepositories"
        class="d-flex ma-0 pa-0"
        color="primary-lighten-4"
        empty-text=""
        mode="manual"
        @load="loadMore"
      >
        <VRow>
          <VCol
            v-for="repository in repositoryStore.items"
            :key="repository.uid"
            class="px-3 pb-5"
            cols="12"
            lg="4"
            md="6"
            sm="12"
          >
            <RepositoryCard :repository="repository" />
          </VCol>
        </VRow>
        <template #load-more="{ props: loadProps }">
          <VBtn v-if="!areAllItemsFetched" variant="tonal" v-bind="loadProps">
            Load more
          </VBtn>
        </template>
      </VInfiniteScroll>
      <VAlert
        v-else-if="noRepositoriesMessage"
        class="mt-4"
        color="primary-lighten-3"
        icon="mdi-alert-circle-outline"
        rounded="lg"
        variant="tonal"
        prominent
      >
        {{ noRepositoriesMessage }}
      </VAlert>
    </VContainer>
  </NuxtLayout>
</template>

<script setup lang="ts">
import find from 'lodash/find';
import map from 'lodash/map';
import { SCHEMAS } from '@tailor-cms/config';
import { storeToRefs } from 'pinia';

import AddRepository from '@/components/catalog/AddRepository/index.vue';
import RepositoryCard from '@/components/catalog/Card/index.vue';
import RepositoryFilter from '~/components/catalog/Filter/RepositoryFilter.vue';
import repositoryFilterConfigs from '~/components/catalog/Filter/repositoryFilterConfigs';
import RepositoryFilterSelection
  from '@/components/catalog/Filter/RepositoryFilterSelection/index.vue';
import SearchInput from '@/components/catalog/Filter/SearchInput.vue';
import SelectOrder from '@/components/catalog/Filter/SelectOrder.vue';
import { useAuthStore } from '@/stores/auth';
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

const isLoading = ref(true);

const {
  queryParams,
  items: repositories,
  tags,
  areAllItemsFetched,
} = storeToRefs(repositoryStore);

const hasRepositories = computed(() => !!repositories.value.length);
const arePinnedShown = computed(() => queryParams.value.pinned);

const togglePinFilter = () => {
  queryParams.value.pinned = !arePinnedShown.value;
  refetchRepositories();
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
  queryParams.value.sortBy = {
    ...queryParams.value.sortBy,
    ...payload,
  };
  refetchRepositories();
};

const onSearchInput = (searchInput: string) => {
  queryParams.value.search = searchInput;
  refetchRepositories();
};

const onFilterChange = (payload: any) => {
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
.catalog-wrapper {
  position: relative;
  height: 100%;
}

.catalog {
  margin-top: 0 !important;

  &.catalog-empty {
    &::before {
      width: 100%;
      height: 100%;
    }
  }
}

.catalog-actions {
  position: relative;
  padding-top: 0.75rem;
}

.v-infinite-scroll {
  overflow-y: unset !important;
  overflow-x: unset !important;
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
