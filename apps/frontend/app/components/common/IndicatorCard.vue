<template>
  <VCard class="indicator-card" elevation="8" rounded="lg">
    <VCardItem class="py-3">
      <template #prepend>
        <VIcon :icon="icon" size="small" />
      </template>
      <VCardTitle class="text-body-medium font-weight-medium">
        {{ title }}
      </VCardTitle>
      <template #append>
        <VBtn
          v-if="isClearable"
          :aria-label="clearLabel"
          density="comfortable"
          icon="mdi-close"
          size="small"
          variant="text"
          @click="$emit('clear')"
        />
      </template>
    </VCardItem>
    <VDivider />
    <VList class="py-0" density="compact" max-height="320">
      <slot />
    </VList>
  </VCard>
</template>

<script lang="ts" setup>
defineProps<{
  // Leading icon shown in the header.
  icon: string;
  // Header text summarising overall progress.
  title: string;
  // Whether the header clear button is shown (once all items have settled).
  isClearable?: boolean;
  // Accessible label for the clear button.
  clearLabel?: string;
}>();

defineEmits<{ clear: [] }>();
</script>

<style lang="scss" scoped>
.indicator-card {
  width: 22.5rem;
  max-width: calc(100vw - 3rem);
  text-align: left;
}
</style>
