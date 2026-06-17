<template>
  <div class="toolbar d-flex align-center flex-wrap ga-3">
    <template v-if="isCollection">
      <VTextField
        v-model="search"
        bg-color="transparent"
        density="comfortable"
        max-width="384"
        min-width="220"
        placeholder="Search by name..."
        prepend-inner-icon="mdi-magnify"
        rounded="pill"
        variant="solo-filled"
        clearable
        flat
        hide-details
        @click:clear="search = ''"
      />
      <VMenu location="bottom end">
        <template #activator="{ props: menuProps }">
          <VBtn
            v-bind="menuProps"
            :text="activeSortLabel"
            append-icon="mdi-chevron-down"
            class="sort-btn"
            prepend-icon="mdi-sort-variant"
            rounded="lg"
            variant="text"
          />
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
      <VSpacer />
      <CreateDialog
        :anchor="anchor"
        :default-type="activeEntity"
        :repository-id="currentRepositoryStore.repositoryId as number"
        activator-color="primary"
        activator-icon="mdi-plus"
        variant="flat"
        open-in-editor
        show-activator
      />
    </template>
    <template v-else>
      <VTextField
        v-model="search"
        bg-color="transparent"
        density="comfortable"
        min-width="220"
        max-width="384"
        placeholder="Search by name or id..."
        prepend-inner-icon="mdi-magnify"
        rounded="pill"
        variant="solo-filled"
        clearable
        flat
        hide-details
        @click:clear="search = ''"
      />
      <VSpacer />
      <VBtn
        v-if="!isFlat"
        :disabled="!!search"
        :text="isOutlineExpanded ? 'Collapse all' : 'Expand all'"
        rounded="lg"
        variant="text"
        @click="currentRepositoryStore.toggleOutlineExpand"
      />
      <LinkContent :anchor="anchor" show-activator />
      <CreateDialog
        :anchor="anchor"
        :repository-id="currentRepositoryStore.repositoryId as number"
        activator-color="primary"
        activator-icon="mdi-plus"
        variant="flat"
        test-id-prefix="repository__createRootActivity"
        show-activator
      />
    </template>
  </div>
</template>

<script lang="ts" setup>
import { filter, find, last, map } from 'lodash-es';
import { storeToRefs } from 'pinia';

import type { CollectionSort } from '@/composables/useCollectionEntities';
import CreateDialog from '@/components/repository/Outline/CreateDialog/index.vue';
import LinkContent from '@/components/repository/Library/LinkContent.vue';
import { useCurrentRepository } from '@/stores/current-repository';

interface SortOption extends CollectionSort {
  title: string;
}

withDefaults(
  defineProps<{
    activeEntity?: string;
  }>(),
  { activeEntity: '' },
);

const search = defineModel<string>('search', { default: '' });
const sort = defineModel<CollectionSort>('sort');

const sortOptions: SortOption[] = [
  { key: 'createdAt', order: 'desc', title: 'Newest first' },
  { key: 'createdAt', order: 'asc', title: 'Oldest first' },
  { key: 'data.name', order: 'asc', title: 'Name (A–Z)' },
  { key: 'data.name', order: 'desc', title: 'Name (Z–A)' },
];

const isActiveSort = (option: SortOption) =>
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
</style>
