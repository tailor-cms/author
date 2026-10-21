<template>
  <VDivider
    :color="color"
    :opacity="color ? 1 : undefined"
    content-offset="-16"
  >
    <VChip
      :closable="isClosable"
      :color="color"
      :link="isClosable"
      :prepend-icon="icon"
      :text="text"
      :variant="color ? 'flat' : 'tonal'"
      class="timeline-divider-chip px-4 font-weight-medium"
      close-icon="mdi-close"
      rounded="pill"
      @click="emit('click')"
      @click:close="emit('close')"
    />
  </VDivider>
</template>

<script lang="ts" setup>
// A labelled break between messages: a new day, or where the unread
// ones start. Spacing is left to the caller
defineProps<{
  text: string;
  color?: string;
  icon?: string;
  // A marker the reader can dismiss; the chip itself is clickable too
  isClosable?: boolean;
}>();

const emit = defineEmits<{ click: []; close: [] }>();
</script>

<style lang="scss" scoped>
.timeline-divider-chip {
  font-size: 0.8125rem;
  letter-spacing: 0.01em;
}
</style>
