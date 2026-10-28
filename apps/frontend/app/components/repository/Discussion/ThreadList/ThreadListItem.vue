<template>
  <VListItem
    :active="isSelected"
    :class="{
      'thread-list-item--unread': thread.unreadCount,
      'thread-list-item--resolved': thread.isResolved,
      'thread-list-item--starred': thread.isStarred,
    }"
    class="thread-list-item px-2"
    min-height="36"
    prepend-gap="8"
    rounded="lg"
    @click="emit('select', thread.id)"
  >
    <template #prepend>
      <VIcon
        v-if="thread.isResolved"
        v-tooltip:right="'Resolved'"
        :aria-hidden="false"
        aria-label="Resolved"
        class="thread-list-item-icon"
        icon="mdi-check-circle-outline"
        color="success"
        role="img"
        size="16"
      />
      <VIcon
        v-else
        :icon="anchor.icon"
        class="thread-list-item-icon"
        size="16"
      />
    </template>
    <template #title>
      <span class="thread-list-item-title text-body-medium">{{ anchor.label }}</span>
    </template>
    <template #append>
      <div class="thread-list-item-trailing">
        <VBadge
          v-if="thread.unreadCount"
          :content="thread.unreadCount"
          :label="`${thread.unreadCount} unread`"
          class="thread-list-item-count"
          color="secondary"
          max="99"
          inline
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
      </div>
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
  .thread-list-item-trailing {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  @media (hover: hover) {
    .thread-list-item-star,
    .thread-list-item-count {
      transition: opacity 0.15s ease;
    }

    .thread-list-item-star {
      opacity: 0;
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

    // The count holds the star's place until the row is hovered
    &:not(.thread-list-item--starred) {
      .thread-list-item-trailing {
        display: grid;
        justify-items: end;

        > * {
          grid-area: 1 / 1;
        }
      }

      &:hover,
      &:focus-within {
        .thread-list-item-count {
          opacity: 0;
        }
      }
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

  &--resolved:not(.thread-list-item--unread) .thread-list-item-title {
    color: rgba(var(--v-theme-on-surface), 0.55);
  }
}
</style>
