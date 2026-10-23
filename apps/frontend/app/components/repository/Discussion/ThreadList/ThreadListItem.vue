<template>
  <VListItem
    :active="isSelected"
    :class="{
      'thread-list-item--unread': thread.isUnread,
      'thread-list-item--resolved': thread.isResolved,
    }"
    class="thread-list-item px-2"
    min-height="36"
    prepend-gap="8"
    rounded="lg"
    @click="emit('select', thread.id)"
  >
    <template #prepend>
      <VIcon :icon="anchor.icon" class="thread-list-item-icon" size="16" />
    </template>
    <template #title>
      <span class="thread-list-item-title text-body-medium">{{ anchor.label }}</span>
    </template>
    <template #append>
      <VIcon
        v-if="thread.isResolved"
        v-tooltip:left="'Resolved'"
        :aria-hidden="false"
        aria-label="Resolved"
        class="mr-1 text-medium-emphasis"
        icon="mdi-check-circle-outline"
        role="img"
        size="16"
      />
      <VBtn
        v-tooltip:left="starLabel"
        :aria-label="starLabel"
        :class="{ 'thread-list-item-star--active': thread.isStarred }"
        :color="thread.isStarred ? 'tertiary' : undefined"
        :icon="thread.isStarred ? 'mdi-star' : 'mdi-star-outline'"
        class="thread-list-item-star"
        density="compact"
        size="small"
        variant="text"
        @click.stop="emit('star', thread.id, !thread.isStarred)"
      />
    </template>
  </VListItem>
</template>

<script lang="ts" setup>
import type { ReaderThread } from '@tailor-cms/api-client';

import { useThreadAnchor } from '../composables/useThreadAnchor';

const props = defineProps<{
  thread: ReaderThread;
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
.thread-list-item {
  @media (hover: hover) {
    .thread-list-item-star {
      opacity: 0;
      transition: opacity 0.15s ease;
    }

    &:hover,
    &:focus-within,
    &.v-list-item--active {
      .thread-list-item-star {
        opacity: 1;
      }
    }

    .thread-list-item-star--active {
      opacity: 1;
    }
  }

  .thread-list-item-title {
    color: rgba(var(--v-theme-on-surface), 0.78);
  }

  &--unread {
    .thread-list-item-icon {
      opacity: 1;
    }

    .thread-list-item-title {
      color: rgb(var(--v-theme-on-surface));
      font-weight: 700;
    }
  }

  &--resolved:not(.thread-list-item--unread) {
    .thread-list-item-icon {
      opacity: 0.55;
    }

    .thread-list-item-title {
      color: rgba(var(--v-theme-on-surface), 0.55);
    }
  }
}
</style>
