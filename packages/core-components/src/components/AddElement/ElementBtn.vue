<template>
  <VBtn
    :disabled="disabled"
    class="add-element"
    color="primary-darken-3"
    rounded="lg"
    variant="text"
    stacked
    border
    @click.stop="$emit('click')"
  >
    <template #prepend>
      <VIcon v-if="element.ui.icon" :icon="element.ui.icon" size="24" />
    </template>
    {{ element.name }}
    <template #append>
      <VIcon
        v-tooltip="element.version"
        class="version-info"
        icon="mdi-information-outline"
        size="16"
      />
    </template>
  </VBtn>
</template>

<script lang="ts" setup>
defineProps<{
  element: any;
  disabled?: boolean;
}>();

defineEmits(['click']);
</script>

<style lang="scss" scoped>
.add-element {
  width: 100%;
  min-width: 8.125rem;
  height: auto !important;
  min-height: 4.75rem;
  background: rgba(var(--v-theme-surface), 0.7);
  padding: 0.5rem 0.375rem !important;

  :deep(.v-btn__content) {
    text-transform: none;
    font-size: 0.75rem;
  }

  :deep(.v-btn__prepend) {
    margin-bottom: 0.25rem;
  }
}

.version-info {
  position: absolute;
  top: 0.375rem;
  right: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.add-element:hover .version-info {
  opacity: 1;
}
</style>
