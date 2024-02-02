<template>
  <VRow class="selected-tags align-center pb-3">
    <SelectedFilter
      v-for="filter in orderedFilters"
      @close="emit('close', filter)"
      :key="filter.id"
      v-bind="filter"
      :icon="filterConfigs[filter.type].icon"
    />
    <VBtn
      @click="emit('clear:all')"
      v-show="repositoryFilter.length"
      size="small"
      variant="tonal"
      color="primary-lighten-2"
      class="mb-1 ml-1"
    >
      Clear all
      <VIcon end>mdi-close-circle</VIcon>
    </VBtn>
  </VRow>
</template>

<script lang="ts" setup>
import filter from 'lodash/filter';
import flatMap from 'lodash/flatMap';
import filterConfigs from '../repositoryFilterConfigs';
import SelectedFilter from './SelectedFilter.vue';
import { useRepositoryStore } from '@/stores/repository';

const emit = defineEmits(['close', 'clear:all']);

const store = useRepositoryStore();

const repositoryFilter = computed(() => store.queryParams.filter);
const orderedFilters = computed(() => {
  return flatMap(filterConfigs, ({ type }) =>
    filter(repositoryFilter.value, { type }),
  );
});
</script>

<style lang="scss" scoped>
.selected-tags {
  min-height: 2.5rem;
}
</style>
