<template>
  <div ref="viewportEl" class="message-viewport">
    <div ref="contentEl" class="message-viewport-content">
      <div
        v-if="pagingStatus !== PagingStatus.Empty"
        class="d-flex justify-center py-4"
      >
        <VBtn
          v-if="pagingStatus === PagingStatus.Error"
          prepend-icon="mdi-refresh"
          size="small"
          text="Retry loading earlier messages"
          variant="text"
          @click="emit('load:older')"
        />
        <VProgressCircular
          v-else
          aria-label="Loading earlier messages"
          indeterminate
        />
      </div>
      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Message } from '@tailor-cms/interfaces/comment';

import { PagingStatus } from '@/stores/messaging';
import { useInfiniteScroll } from '@vueuse/core';
import { useStickToBottom } from './composables/useStickToBottom';

// A message list pinned to its newest entry, asking for earlier ones as
// its top comes into view
interface Props {
  messages: Message[];
  // Opened at and highlighted, e.g. from a search result
  focusedId?: number | null;
  // Loading earlier messages; after a failure, scrolling waits for a retry
  pagingStatus?: PagingStatus;
}

const props = withDefaults(defineProps<Props>(), {
  focusedId: null,
  pagingStatus: PagingStatus.Empty,
});

const emit = defineEmits<{ 'load:older': [] }>();

// Ahead of the very top, so the next page is often in before it's reached
const LOAD_DISTANCE_PX = 200;

const viewportEl = ref<HTMLElement>();
const contentEl = ref<HTMLElement>();

useInfiniteScroll(viewportEl, () => emit('load:older'), {
  direction: 'top',
  distance: LOAD_DISTANCE_PX,
  canLoadMore: () => props.pagingStatus === PagingStatus.Ok,
});

useStickToBottom(
  viewportEl,
  contentEl,
  () => props.messages,
  () => props.focusedId,
);
</script>

<style lang="scss" scoped>
.message-viewport {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

// A short list sits at the bottom, by the composer
.message-viewport-content {
  margin-top: auto;
}
</style>
