<template>
  <VRow
    v-if="repositoryFilter.length"
    class="selected-tags align-center mt-0 mb-6 ml-0 ga-2"
  >
    <SelectedFilter
      v-for="filter in orderedFilters"
      :key="filter.id"
      v-bind="filter"
      :icon="filterConfigs[filter.type].icon"
      @close="emit('close', filter)"
    />
    <VBtn
      v-show="repositoryFilter.length"
      color="teal-lighten-3"
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
import { filter as filterBy, flatMap } from 'lodash-es';

import filterConfigs from '../repositoryFilterConfigs';
import SelectedFilter from './SelectedFilter.vue';
import { useRepositoryStore } from '@/stores/repository';

const store = useRepositoryStore();

const emit = defineEmits(['close', 'clear:all']);

const repositoryFilter = computed(() => store.queryParams.filter);
const orderedFilters = computed(() => {
  return flatMap(filterConfigs, ({ type }) =>
    filterBy(repositoryFilter.value, { type }),
  ) as any[];
});
</script>
