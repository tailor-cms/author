<template>
  <NuxtLayout name="main" class="catalog-wrapper">
    <VContainer :class="{ 'catalog-empty': !hasRepositories }" class="catalog">
      <VRow no-gutters class="catalog-actions">
        <AddRepository :is-admin="authStore.isAdmin" @done="onRepositoryAdd" />
        <VCol md="4" sm="10" offset-md="4" offset-sm="1">
          <Search
            @update="onSearchInput"
            :search-input="repositoryStore.queryParams.search"
          />
        </VCol>
        <VCol md="3" sm="1" class="text-sm-left pl-2">
          <VTooltip location="top" open-delay="400">
            <template v-slot:activator="{ props }">
              <VBtn
                v-bind="props"
                @click="togglePinFilter"
                :color="arePinnedShown ? 'lime-accent-3' : 'primary-lighten-1'"
                :icon="arePinnedShown ? 'mdi-pin mdi-rotate-45' : 'mdi-pin'"
                class="my-1"
                variant="tonal"
              >
              </VBtn>
            </template>
            <span>{{ arePinnedShown ? 'Show all' : 'Show pinned' }}</span>
          </VTooltip>
          <SelectOrder
            @update="updateSort"
            :sort-by="queryParams.sortBy"
            class="pl-2"
          />
          <RepositoryFilter
            v-for="filter in filters"
            :key="filter.type"
            @update="onFilterChange"
            v-bind="filter"
          />
        </VCol>
      </VRow>
      <RepositoryFilterSelection
        @close="onFilterChange"
        @clear:all="onFilterChange"
      />
      <VInfiniteScroll
        v-if="hasRepositories"
        @load="loadMore"
        class="d-flex ma-0 pa-0"
        color="primary-lighten-2"
        empty-text=""
        mode="manual"
      >
        <VRow>
          <VCol
            v-for="repository in repositoryStore.items"
            :key="repository.uid"
            cols="4"
            class="px-2 pb-5"
          >
            <RepositoryCard :repository="repository" />
          </VCol>
        </VRow>
      </VInfiniteScroll>
    </VContainer>
  </NuxtLayout>
</template>

<script setup lang="ts">
import AddRepository from '@/components/catalog/AddRepository/index.vue';
import find from 'lodash/find';
import map from 'lodash/map';
import Search from '@/components/catalog/Filter/Search.vue';
import SelectOrder from '@/components/catalog/Filter/SelectOrder.vue';
import RepositoryCard from '@/components/catalog/Card/index.vue';
import RepositoryFilter from '~/components/catalog/Filter/RepositoryFilter.vue';
import RepositoryFilterSelection from '@/components/catalog/Filter/RepositoryFilterSelection/index.vue';
import repositoryFilterConfigs from '~/components/catalog/Filter/repositoryFilterConfigs';
import { SCHEMAS } from 'tailor-config-shared';
import { storeToRefs } from 'pinia';
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

const { queryParams, items: repositories, tags } = storeToRefs(repositoryStore);
const hasRepositories = computed(() => !!repositories.value.length);

const arePinnedShown = computed(() => queryParams.value.pinned);
const togglePinFilter = () => {
  queryParams.value.pinned = !arePinnedShown.value;
  repositoryStore.fetch();
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
  repositoryStore.fetch();
};

const onFilterChange = (val: any) => {
  const { filter: catalogFilter } = queryParams.value;
  const existing = find(catalogFilter, { id: val.id });
  if (!existing) queryParams.value.filter.push(val);
  else
    queryParams.value.filter = catalogFilter.filter(
      (it: any) => it.id !== val.id,
    );
  repositoryStore.fetch();
};

const onRepositoryAdd = async () => {
  repositoryStore.resetQueryParams();
  await repositoryStore.fetch();
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
