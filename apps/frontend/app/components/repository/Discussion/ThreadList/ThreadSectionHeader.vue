<template>
  <VListItem
    :aria-expanded="isOpen"
    class="thread-section-header px-2"
    min-height="32"
    prepend-gap="8"
    rounded="lg"
  >
    <template #prepend>
      <VIcon
        :class="{ 'thread-section-chevron--open': isOpen }"
        class="thread-section-chevron"
        icon="mdi-chevron-right"
        size="16"
      />
    </template>
    <template #title>
      <span class="thread-section-label text-label-medium">{{ label }}</span>
    </template>
    <template #append>
      <VBadge
        v-if="!isOpen && unreadCount"
        :content="unreadCount"
        :label="`${unreadCount} unread`"
        color="secondary"
        max="99"
        inline
      />
    </template>
  </VListItem>
</template>

<script lang="ts" setup>
defineProps<{
  label: string;
  isOpen: boolean;
  unreadCount: number;
}>();
</script>

<style lang="scss" scoped>
.thread-section-header {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.thread-section-label {
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.thread-section-chevron {
  transition: transform 0.2s ease-in-out;

  &--open {
    transform: rotate(90deg);
  }
}
</style>
