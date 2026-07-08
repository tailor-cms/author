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
        {{ count }} selected
      </span>
      <VBtn
        :text="isAllSelected ? 'Deselect all' : 'Select all'"
        class="ml-1"
        size="small"
        variant="text"
        rounded="lg"
        @click="$emit('toggle-all')"
      />
      <VSpacer />
      <VBtn
        :loading="isDeleting"
        :disabled="isDeleting || !hasSelection"
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
const props = defineProps<{
  count: number;
  isAllSelected: boolean;
  isDeleting: boolean;
}>();

defineEmits<{
  'delete': [];
  'clear': [];
  'toggle-all': [];
}>();

const hasSelection = computed(() => props.count > 0);
</script>

<style lang="scss" scoped>
.bulk-action-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}
</style>
