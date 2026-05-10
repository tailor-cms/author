<template>
  <VSlideYTransition>
    <div v-if="hasSelection" class="bulk-action-bar bg-primary-darken-2">
      <VChip
        class="selection-count"
        color="primary-lighten-4"
        density="compact"
        variant="flat"
        rounded="xl"
      >
        {{ selectedIds.size }} selected
      </VChip>
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
              color="primary-lighten-3"
              prepend-icon="mdi-brain"
              size="small"
              variant="outlined"
              @click="$emit('index')"
            >
              Index selected
            </VBtn>
          </div>
        </template>
      </VTooltip>
      <VBtn
        :loading="isBulkDeleting"
        :disabled="isBulkDeleting"
        color="primary-lighten-3"
        prepend-icon="mdi-delete"
        size="small"
        variant="outlined"
        @click="$emit('delete')"
      >
        Delete selected
      </VBtn>
      <VBtn
        class="cancel-btn"
        color="primary-lighten-3"
        size="small"
        variant="text"
        @click="$emit('clear')"
      >
        Cancel
      </VBtn>
    </div>
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
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 1.25rem;
  border-radius: 4px;
}

.selection-count {
  min-height: 1.75rem;
  margin-right: 0.25rem;
  padding: 0 0.75rem;
  font-size: 0.875rem;
}

.cancel-btn {
  margin-left: 0.25rem;
}
</style>
