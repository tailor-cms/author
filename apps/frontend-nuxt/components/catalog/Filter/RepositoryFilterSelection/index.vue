<template>
  <VRow class="selected-tags align-center pb-3">
    <SelectedFilter
      v-for="filter in orderedFilters"
      :key="filter.id"
      v-bind="filter"
      :icon="filterConfigs[filter.type].icon"
      @close="emit('close', filter)"
    />
    <VBtn
      v-show="repositoryFilter.length"
      class="mb-1 ml-1"
      color="primary-lighten-2"
      size="small"
      variant="tonal"
      @click="emit('clear:all')"
    >
      Clear all
      <VIcon end>mdi-close-circle</VIcon>
    </VBtn>
  </VRow>
</template>

<script lang="ts" setup>
import filterBy from 'lodash/filter';
import flatMap from 'lodash/flatMap';

import filterConfigs from '../repositoryFilterConfigs';
import SelectedFilter from './SelectedFilter.vue';
import { useRepositoryStore } from '@/stores/repository';

const emit = defineEmits(['close', 'clear:all']);

const store = useRepositoryStore();

const repositoryFilter = computed(() => store.queryParams.filter);
const orderedFilters = computed(() => {
  return flatMap(filterConfigs, ({ type }) =>
    filterBy(repositoryFilter.value, { type }),
  );
});
</script>

<style lang="scss" scoped>
.selected-tags {
  min-height: 2.5rem;
}
</style>
