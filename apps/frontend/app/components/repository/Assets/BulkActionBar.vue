<template>
  <VSlideYTransition>
    <VSheet
      v-if="hasSelection"
      color="surface-container-high"
      class="bulk-action-bar mb-4 pa-4 ga-2"
      rounded="lg"
    >
      <VBtn
        v-tooltip:bottom="'Clear selection'"
        aria-label="Clear selection"
        icon="mdi-close"
        size="small"
        variant="text"
        density="comfortable"
        @click="$emit('clear')"
      />
      <span class="selection-count text-label-large font-weight-semibold">
        {{ selected.size }} selected
      </span>
      <VBtn
        :text="isAllSelected ? 'Deselect all' : 'Select all'"
        class="ml-1"
        size="small"
        variant="text"
        rounded="lg"
        @click="$emit('toggle-all', !isAllSelected)"
      />
      <VSpacer />
      <div v-tooltip:bottom="indexTooltip">
        <VBtn
          :disabled="!hasIndexable || isIndexing"
          :loading="isIndexing"
          color="secondary"
          prepend-icon="mdi-brain"
          size="small"
          text="Index"
          variant="tonal"
          @click="$emit('index')"
        />
      </div>
      <VBtn
        :disabled="!hasSelection"
        prepend-icon="mdi-folder-move-outline"
        size="small"
        text="Move"
        variant="tonal"
        @click="$emit('move')"
      />
      <VBtn
        :loading="isBulkDeleting"
        :disabled="isBulkDeleting || !hasSelection"
        prepend-icon="mdi-trash-can-outline"
        color="error"
        size="small"
        text="Delete"
        variant="tonal"
        @click="$emit('delete')"
      />
    </VSheet>
  </VSlideYTransition>
</template>

<script lang="ts" setup>
import type { Asset } from '@tailor-cms/interfaces/asset';
import { ProcessingStatus } from '@tailor-cms/interfaces/asset';
import { canIndex } from './utils';
import { oneLine } from 'common-tags';

const props = defineProps<{
  selected: Map<number, Asset>;
  isAllSelected: boolean;
  isIndexing: boolean;
  isBulkDeleting: boolean;
}>();

defineEmits<{
  'index': [];
  'move': [];
  'delete': [];
  'clear': [];
  'toggle-all': [selected: boolean];
}>();

const hasSelection = computed(() => props.selected.size > 0);

// props.selected is a Map, so spread its values into an array the index
// checks below can filter/iterate over
const selectedAssets = computed(() => [...props.selected.values()]);

const indexableCount = computed(
  () => selectedAssets.value.filter((a) => canIndex(a)).length,
);

const hasIndexable = computed(() => indexableCount.value > 0);

const indexTooltip = computed(() => {
  const total = props.selected.size;
  const items = total === 1 ? 'item' : 'items';
  if (indexableCount.value > 0) {
    return `${indexableCount.value} of ${total} selected ${items} can be indexed`;
  }
  const allIndexed = selectedAssets.value.every(
    (a) => a.processingStatus === ProcessingStatus.Completed,
  );
  if (allIndexed) {
    return `Selected ${items} ${total === 1 ? 'is' : 'are'} already indexed.`;
  }
  return oneLine`
    None of the ${total} selected ${items} can be indexed - add a
    description or tags to make an asset eligible.
  `;
});
</script>

<style lang="scss" scoped>
.bulk-action-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}
</style>
