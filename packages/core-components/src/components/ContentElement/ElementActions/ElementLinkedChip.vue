<template>
  <VChip
    v-tooltip:bottom="{
      text: 'Linked from another repository',
      openDelay: 400,
    }"
    :aria-label="isInteractive ? 'Linked content' : undefined"
    :link="isInteractive"
    :tag="isInteractive ? 'button' : 'span'"
    class="linked-chip"
    color="secondary"
    density="comfortable"
    prepend-icon="mdi-link"
    rounded="md"
    size="small"
    text="Linked"
    variant="tonal"
  />
</template>

<script lang="ts" setup>
interface Props {
  isInteractive?: boolean;
}

withDefaults(defineProps<Props>(), {
  isInteractive: false,
});
</script>

<style lang="scss" scoped>
.linked-chip {
  flex-shrink: 0;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.0625em;

  :deep(.v-icon) {
    font-size: 0.875rem;
  }
}
</style>
