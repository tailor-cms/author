<template>
  <div class="bulk-action-bar-dock">
    <VSlideYReverseTransition>
      <VSheet
        v-if="count > 0"
        aria-label="Bulk actions"
        class="bulk-action-bar mt-6 pa-3 ga-1"
        color="transparent"
        role="toolbar"
        rounded="pill"
        border
      >
        <VBtn
          v-tooltip:top="'Clear selection'"
          aria-label="Clear selection"
          icon="mdi-close"
          size="small"
          variant="text"
          density="comfortable"
          @click="$emit('clear')"
        />
        <span
          class="selection-count text-label-large font-weight-semibold
            text-no-wrap px-1"
        >
          {{ count }} selected
        </span>
        <VBtn
          :text="isAllSelected ? 'Deselect all' : 'Select all'"
          rounded="pill"
          size="small"
          variant="text"
          @click="$emit('toggle-all', !isAllSelected)"
        />
        <VSpacer />
        <slot></slot>
      </VSheet>
    </VSlideYReverseTransition>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  count: number;
  isAllSelected: boolean;
}>();

defineEmits<{
  'clear': [];
  'toggle-all': [selected: boolean];
}>();
</script>

<style lang="scss" scoped>
.bulk-action-bar-dock {
  position: sticky;
  bottom: 1.5rem;
  z-index: 10;
  display: flex;
  justify-content: center;
  margin-top: auto;
  pointer-events: none;
}

.bulk-action-bar {
  display: flex;
  align-items: center;
  width: fit-content;
  min-width: min(40rem, 100%);
  pointer-events: auto;
  background-color: rgba(var(--v-theme-surface-overlay), 0.72);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  backdrop-filter: blur(24px) saturate(180%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.14),
    0 8px 24px rgba(0, 0, 0, 0.18);
}
</style>
