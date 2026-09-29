<template>
  <VDivider
    :color="color"
    :opacity="color ? 1 : undefined"
    class="my-6"
    content-offset="-16"
  >
    <VChip
      :color="color"
      :prepend-icon="icon"
      :text="text"
      :variant="color ? 'flat' : 'tonal'"
      class="timeline-divider-chip px-4 font-weight-medium"
      rounded="pill"
    />
  </VDivider>
</template>

<script lang="ts" setup>
// A labelled break in the messages
// A new day or unread marker within the message timeline
defineProps<{
  text: string;
  color?: string;
  icon?: string;
}>();
</script>

<style lang="scss" scoped>
.timeline-divider-chip {
  font-size: 0.8125rem;
  letter-spacing: 0.01em;
}
</style>
