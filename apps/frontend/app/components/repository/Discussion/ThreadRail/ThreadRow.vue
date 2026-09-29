<template>
  <VListItem
    :active="isSelected"
    :class="{
      'thread-row--unread': thread.isUnread,
      'thread-row--resolved': thread.isResolved,
    }"
    class="thread-row px-2"
    min-height="36"
    prepend-gap="8"
    rounded="lg"
    @click="emit('select', thread.id)"
  >
    <template #prepend>
      <VIcon
        :color="thread.isResolved ? 'success' : undefined"
        :icon="thread.isResolved ? 'mdi-check' : anchor.icon"
        class="thread-row-icon"
        size="16"
      />
    </template>
    <template #title>
      <span class="thread-row-title text-body-medium">{{ anchor.label }}</span>
    </template>
    <template #append>
      <VBtn
        v-tooltip:left="starLabel"
        :aria-label="starLabel"
        :class="{ 'thread-row-star--active': thread.isStarred }"
        :color="thread.isStarred ? 'tertiary' : undefined"
        :icon="thread.isStarred ? 'mdi-star' : 'mdi-star-outline'"
        class="thread-row-star"
        density="compact"
        size="small"
        variant="text"
        @click.stop="emit('star', thread.id, !thread.isStarred)"
      />
    </template>
  </VListItem>
</template>

<script lang="ts" setup>
import type { DiscussionThread } from '@/stores/discussion';

import { useThreadAnchor } from '../composables/useThreadAnchor';

const props = defineProps<{
  thread: DiscussionThread;
  isSelected?: boolean;
}>();

const emit = defineEmits<{
  select: [threadId: number];
  star: [threadId: number, isStarred: boolean];
}>();

const anchor = useThreadAnchor(() => props.thread);

const starLabel = computed(() =>
  props.thread.isStarred ? 'Remove star' : 'Star thread',
);
</script>

<style lang="scss" scoped>
.thread-row {
  .thread-row-star {
    opacity: 0.3;
    transition: opacity 0.15s ease;
  }

  &:hover .thread-row-star,
  .thread-row-star:focus-visible,
  .thread-row-star--active {
    opacity: 1;
  }

  .thread-row-title {
    color: rgba(var(--v-theme-on-surface), 0.78);
  }

  &--unread {
    .thread-row-icon {
      opacity: 1;
    }

    .thread-row-title {
      color: rgb(var(--v-theme-on-surface));
      font-weight: 700;
    }
  }

  &--resolved .thread-row-title {
    color: rgba(var(--v-theme-on-surface), 0.55);
  }
}
</style>
