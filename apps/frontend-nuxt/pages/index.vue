<template>
  <NuxtLayout class="catalog-wrapper" name="main">
    <VContainer :class="{ 'catalog-empty': !hasRepositories }" class="catalog">
      <VRow class="catalog-actions" no-gutters>
        <AddRepository :is-admin="authStore.isAdmin" @done="onRepositoryAdd" />
        <VCol md="4" offset-md="4" offset-sm="1" sm="10">
          <SearchInput
            :search-input="repositoryStore.queryParams.search"
            @update="onSearchInput"
          />
        </VCol>
        <VCol class="text-sm-left pl-2" md="3" sm="1">
          <VTooltip location="top" open-delay="400">
            <template #activator="{ props }">
              <VBtn
                v-bind="props"
                :color="arePinnedShown ? 'lime-accent-3' : 'primary-lighten-1'"
                :icon="arePinnedShown ? 'mdi-pin mdi-rotate-45' : 'mdi-pin'"
                class="my-1"
                variant="tonal"
                @click="togglePinFilter"
              >
              </VBtn>
            </template>
            <span>{{ arePinnedShown ? 'Show all' : 'Show pinned' }}</span>
          </VTooltip>
          <SelectOrder
            :sort-by="queryParams.sortBy"
            class="pl-2"
            @update="updateSort"
          />
          <RepositoryFilter
            v-for="filter in filters"
            :key="filter.type"
            v-bind="filter"
            @update="onFilterChange"
          />
        </VCol>
      </VRow>
      <RepositoryFilterSelection
        @clear:all="(queryParams.filter = []) && refetchRepositories()"
        @close="onFilterChange"
      />
      <VInfiniteScroll
        v-if="hasRepositories"
        class="d-flex ma-0 pa-0"
        color="primary-lighten-2"
        empty-text=""
        mode="manual"
        @load="loadMore"
      >
        <VRow>
          <VCol
            v-for="repository in repositoryStore.items"
            :key="repository.uid"
            class="px-2 pb-5"
            cols="4"
          >
            <RepositoryCard :repository="repository" />
          </VCol>
        </VRow>
        <template v-slot:load-more="{ props }">
          <v-btn
            v-if="!areAllItemsFetched"
            variant="tonal"
            v-bind="props">
            Load more
          </v-btn>
      </template>`
      </VInfiniteScroll>
    </VContainer>
  </NuxtLayout>
</template>

<script setup lang="ts">
import find from 'lodash/find';
import map from 'lodash/map';
import { SCHEMAS } from 'tailor-config-shared';
import { storeToRefs } from 'pinia';

import AddRepository from '@/components/catalog/AddRepository/index.vue';
import RepositoryCard from '@/components/catalog/Card/index.vue';
import RepositoryFilter from '~/components/catalog/Filter/RepositoryFilter.vue';
import repositoryFilterConfigs from '~/components/catalog/Filter/repositoryFilterConfigs';
import RepositoryFilterSelection from '@/components/catalog/Filter/RepositoryFilterSelection/index.vue';
import SearchInput from '@/components/catalog/Filter/SearchInput.vue';
import SelectOrder from '@/components/catalog/Filter/SelectOrder.vue';
import { useAuthStore } from '@/stores/auth';
import { useRepositoryStore } from '@/stores/repository';

definePageMeta({
  name: 'catalog',
  middleware: ['auth'],
});

const authStore = useAuthStore();
const repositoryStore = useRepositoryStore();

await authStore.fetchUserInfo();
await repositoryStore.fetch();
await repositoryStore.fetchTags();

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
  if (SCHEMAS.length > 1) filters.push({ ...SCHEMA, values: SCHEMAS as any[] });
  return map(filters, ({ type, values, ...config }) => {
    values = map(values, (it) => {
      const isSelected = !!find(queryParams.value.filter, { id: it.id, type });
      return { ...it, type, isSelected };
    });
    return { type, values, ...config };
  });
});

const updateSort = (val: any) => {
  queryParams.value.sortBy = {
    ...queryParams.value.sortBy,
    ...val,
  };
  repositoryStore.fetch();
};

const onSearchInput = (val: string) => {
  queryParams.value.search = val;
  refetchRepositories();
};

const onFilterChange = (val: any) => {
  const { filter: catalogFilter } = queryParams.value;
  const existing = find(catalogFilter, { id: val.id });
  if (!existing) queryParams.value.filter.push(val);
  else
    queryParams.value.filter = catalogFilter.filter(
      (it: any) => it.id !== val.id,
    );
  refetchRepositories();
};

const onRepositoryAdd = async () => {
  repositoryStore.resetQueryParams();
  await repositoryStore.fetch();
};

const refetchRepositories = () => {
  repositoryStore.resetPaginationParams();
  repositoryStore.fetch();
};

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
</script>

<style lang="scss" scoped>
.catalog-wrapper {
  position: relative;
  height: 100%;
}

.catalog {
  margin-top: 0 !important;

  @media (min-width: 1264px) {
    max-width: 1185px;
  }

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

  ::v-deep .add-repo {
    top: 0.5rem;
    right: 0.75rem;
  }
}

.v-infinite-scroll {
  overflow-y: unset !important;
  overflow-x: unset !important;
}

::v-deep .v-infinite-scroll__side {
  > button {
    margin-top: 1.5rem;
  }

  .v-progress-circular {
    margin-top: 1.5rem;
  }
}
</style>
