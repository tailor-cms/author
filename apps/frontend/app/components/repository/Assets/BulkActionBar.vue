<template>
  <VSlideYTransition>
    <VSheet
      v-if="hasSelection"
      color="surface-container"
      class="bulk-action-bar mb-4 pa-6 ga-3"
      rounded="lg"
    >
      <VChip
        :text="`${selectedIds.size} selected`"
        class="selection-count"
        density="comfortable"
        rounded="pill"
      />
      <VSpacer />
      <VTooltip
        :disabled="hasIndexable"
        location="bottom"
        text="Selected assets need a description or tags to be indexed"
      >
        <template #activator="{ props: tooltipProps }">
          <div v-bind="tooltipProps">
            <VBtn
              :disabled="!hasIndexable || isIndexing"
              :loading="isIndexing"
              prepend-icon="mdi-brain"
              size="small"
              text="Index selected"
              variant="outlined"
              @click="$emit('index')"
            />
          </div>
        </template>
      </VTooltip>
      <VBtn
        :loading="isBulkDeleting"
        :disabled="isBulkDeleting"
        prepend-icon="mdi-trash-can-outline"
        color="error"
        size="small"
        text="Delete selected"
        variant="outlined"
        @click="$emit('delete')"
      />
      <VBtn
        size="small"
        text="Cancel"
        variant="tonal"
        @click="$emit('clear')"
      />
    </VSheet>
  </VSlideYTransition>
</template>

<script lang="ts" setup>
import type { Asset } from '@tailor-cms/interfaces/asset';

import { isIndexable } from './utils';

const props = defineProps<{
  assets: Asset[];
  selectedIds: Set<number>;
  isIndexing: boolean;
  isBulkDeleting: boolean;
}>();

defineEmits<{
  index: [];
  delete: [];
  clear: [];
}>();

const hasSelection = computed(() => props.selectedIds.size > 0);

const hasIndexable = computed(() =>
  props.assets
    .filter((a) => props.selectedIds.has(a.id))
    .some((a) => isIndexable(a)),
);
</script>

<style lang="scss" scoped>
.bulk-action-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}
</style>
