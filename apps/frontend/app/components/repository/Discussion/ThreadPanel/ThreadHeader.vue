<template>
  <div class="thread-header d-flex align-center ga-3 pl-4">
    <div class="thread-header-text d-flex align-center ga-2">
      <VIcon
        v-if="!isChannelThread(thread)"
        :icon="anchor.icon"
        class="text-medium-emphasis"
        size="20"
      />
      <h3
        :title="anchor.label"
        class="thread-title text-title-medium font-weight-medium text-truncate"
      >
        {{ anchor.label }}
      </h3>
    </div>
    <VSpacer />
    <VChip
      v-if="thread.isResolved"
      color="success"
      prepend-icon="mdi-check-circle-outline"
      rounded="pill"
      size="small"
      text="Resolved"
      variant="tonal"
    />
    <VBtn
      v-if="anchor.href"
      v-tooltip:bottom="'Open in editor'"
      :href="anchor.href"
      aria-label="Open in editor"
      density="comfortable"
      variant="text"
      icon
    >
      <VIcon icon="mdi-open-in-new" size="small" />
    </VBtn>
  </div>
</template>

<script lang="ts" setup>
import type { ReaderThread } from '@tailor-cms/api-client';

import { isChannelThread } from '../utils';
import { useThreadAnchor } from '../composables/useThreadAnchor';

const props = defineProps<{
  thread: ReaderThread;
}>();

// Names the thread: a channel by its subject, others by their content
const anchor = useThreadAnchor(() => props.thread);
</script>

<style lang="scss" scoped>
// Lets a long title truncate instead of pushing the toolbar actions out
.thread-header,
.thread-header-text {
  min-width: 0;
}
</style>
