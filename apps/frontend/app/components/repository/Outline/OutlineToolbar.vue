<template>
  <div class="toolbar d-flex align-center flex-wrap ga-2">
    <template v-if="isCollection">
      <VHover>
        <template #default="{ props: hoverProps }">
          <VTextField
            v-bind="hoverProps"
            v-model="search"
            :bg-color="'transparent'"
            density="compact"
            min-width="220"
            placeholder="Search by name..."
            prepend-inner-icon="mdi-magnify"
            rounded="xl"
            variant="outlined"
            clearable
            hide-details
            @click:clear="search = ''"
          />
        </template>
      </VHover>
      <VSpacer />
      <VMenu location="bottom end">
        <template #activator="{ props: menuProps }">
          <VBtn
            v-bind="menuProps"
            append-icon="mdi-chevron-down"
            class="sort-btn"
            prepend-icon="mdi-sort-variant"
            rounded="lg"
            size="small"
            variant="tonal"
          >
            {{ activeSortLabel }}
          </VBtn>
        </template>
        <VList density="compact" min-width="220" slim>
          <VListSubheader>Sort by</VListSubheader>
          <VListItem
            v-for="option in sortOptions"
            :key="`${option.key}-${option.order}`"
            :active="isActiveSort(option)"
            :prepend-icon="isActiveSort(option) ? 'mdi-check' : 'mdi-blank'"
            :title="option.title"
            @click="sort = { key: option.key, order: option.order }"
          />
        </VList>
      </VMenu>
      <CreateDialog
        :anchor="anchor"
        :repository-id="currentRepositoryStore.repositoryId as number"
        activator-color="teal-lighten-3"
        activator-icon="mdi-plus"
        size="small"
        variant="tonal"
        show-activator
      />
    </template>
    <template v-else>
      <VHover>
        <template #default="{ props: hoverProps }">
          <VTextField
            v-bind="hoverProps"
            v-model="search"
            :bg-color="'transparent'"
            density="compact"
            min-width="220"
            placeholder="Search by name or id..."
            prepend-inner-icon="mdi-magnify"
            rounded="xl"
            variant="outlined"
            clearable
            hide-details
            @click:clear="search = ''"
          />
        </template>
      </VHover>
      <VSpacer />
      <VBtn
        v-if="!isFlat"
        :disabled="!!search"
        class="text-none"
        color="teal-lighten-3"
        variant="tonal"
        rounded="lg"
        size="small"
        @click="currentRepositoryStore.toggleOutlineExpand"
      >
        {{ isOutlineExpanded ? 'Collapse all' : 'Expand all' }}
      </VBtn>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { filter, find, last, map } from 'lodash-es';
import { storeToRefs } from 'pinia';

import {
  COLLECTION_SORT_OPTIONS,
  type CollectionSort,
  type CollectionSortOption,
} from '@/components/repository/Outline/collectionSort';
import CreateDialog from '@/components/repository/Outline/CreateDialog/index.vue';
import { useCurrentRepository } from '@/stores/current-repository';

const search = defineModel<string>('search', { default: '' });
const sort = defineModel<CollectionSort>('sort');

const sortOptions = COLLECTION_SORT_OPTIONS;

const isActiveSort = (option: CollectionSortOption) =>
  sort.value?.key === option.key && sort.value?.order === option.order;

const activeSortLabel = computed(
  () => sortOptions.find(isActiveSort)?.title ?? 'Sort',
);

const currentRepositoryStore = useCurrentRepository();
const {
  outlineActivities,
  rootActivities,
  taxonomy,
  isCollection,
  isOutlineExpanded,
} = storeToRefs(currentRepositoryStore);

const isFlat = computed(() => {
  const types = map(
    filter(taxonomy.value, (it) => !it.rootLevel),
    'type',
  );
  if (!types.length) return false;
  return !find(outlineActivities.value, (it) => types.includes(it.type));
});

const anchor = computed(() => last(rootActivities.value));
</script>

<style lang="scss" scoped>
.toolbar {
  z-index: 1;
}

.sort-btn {
  opacity: 0.85;

  &:hover {
    opacity: 1;
  }
}

.v-text-field {
  max-width: 24rem;
  transition: all 1s;

  :deep(.v-field__outline) {
    display: none;
  }
}

:deep(input::placeholder) {
  opacity: 0.75;
}
</style>
