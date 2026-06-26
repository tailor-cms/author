<template>
  <VSlideYTransition>
    <VSheet
      v-if="hasSelection"
      color="surface-container"
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
      <div
        v-tooltip:bottom="{
          text: 'Selected assets need a description or tags to be indexed',
          disabled: hasIndexable,
        }"
      >
        <VBtn
          :disabled="!hasIndexable || isIndexing"
          :loading="isIndexing"
          color="tertiary"
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

import { isIndexable } from './utils';

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

const hasIndexable = computed(() =>
  [...props.selected.values()].some((a) => isIndexable(a)),
);
</script>

<style lang="scss" scoped>
.bulk-action-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}
</style>
