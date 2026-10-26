<template>
  <div ref="viewportEl" class="message-viewport">
    <div ref="contentEl" class="message-viewport-content">
      <PagingIndicator
        :status="paging.older"
        label="earlier messages"
        @retry="emit('load:older')"
      />
      <slot />
      <PagingIndicator
        :status="paging.newer"
        label="newer messages"
        @retry="emit('load:newer')"
      />
    </div>
    <div v-if="hasNewer" class="jump-to-latest d-flex justify-center pb-4">
      <VBtn
        prepend-icon="mdi-arrow-down"
        rounded="pill"
        size="small"
        text="Jump to latest"
        variant="elevated"
        @click="emit('jump:latest')"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Message } from '@tailor-cms/interfaces/comment';

import {
  NO_PAGING,
  type Paging,
  PagingStatus,
} from '@/stores/messaging/pages';
import { useInfiniteScroll } from '@vueuse/core';
import { useStickToBottom } from './composables/useStickToBottom';
import PagingIndicator from './PagingIndicator.vue';

// A message list pinned to its newest entry, asking for more as either
// end comes into view; opened at an older message, it stops short of the
// newest until scrolled down to
interface Props {
  messages: Message[];
  // Opened at and highlighted, e.g. from a search result
  focusedId?: number | null;
  // Loading more at either end; after a failure, scrolling waits for a
  // retry
  paging?: Paging;
}

const props = withDefaults(defineProps<Props>(), {
  focusedId: null,
  paging: () => NO_PAGING,
});

const emit = defineEmits<{
  'load:older': [];
  'load:newer': [];
  'jump:latest': [];
}>();

// Ahead of either end, so the next page is often in before it's reached
const LOAD_DISTANCE_PX = 200;

const viewportEl = ref<HTMLElement>();
const contentEl = ref<HTMLElement>();

const hasNewer = computed(() => props.paging.newer !== PagingStatus.Empty);

useInfiniteScroll(viewportEl, () => emit('load:older'), {
  direction: 'top',
  distance: LOAD_DISTANCE_PX,
  canLoadMore: () => props.paging.older === PagingStatus.Ok,
});

useInfiniteScroll(viewportEl, () => emit('load:newer'), {
  direction: 'bottom',
  distance: LOAD_DISTANCE_PX,
  canLoadMore: () => props.paging.newer === PagingStatus.Ok,
});

useStickToBottom(
  viewportEl,
  contentEl,
  () => props.messages,
  () => props.focusedId,
  hasNewer,
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

// Floats over the end of the list while the newest are not loaded
.jump-to-latest {
  position: sticky;
  bottom: 0;
  pointer-events: none;

  .v-btn {
    pointer-events: auto;
  }
}
</style>
