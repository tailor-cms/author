<template>
  <div class="d-flex align-center ga-3 pa-4">
    <div class="thread-header-text d-flex align-center ga-2">
      <VIcon
        v-if="!isChannelThread(thread)"
        :icon="anchor.icon"
        class="text-medium-emphasis"
        size="20"
      />
      <h3
        :title="anchor.label"
        class="thread-title text-title-medium font-weight-bold text-truncate"
      >
        {{ anchor.label }}
      </h3>
      <VChip
        v-if="thread.isResolved"
        color="success"
        density="comfortable"
        prepend-icon="mdi-check-circle-outline"
        rounded="pill"
        size="x-small"
        text="Resolved"
        variant="tonal"
      />
    </div>
    <VSpacer />
    <VBtn
      v-if="anchor.href"
      v-tooltip:bottom="'Open in editor'"
      :href="anchor.href"
      aria-label="Open in editor"
      density="comfortable"
      icon="mdi-open-in-new"
      size="small"
      variant="text"
    />
    <slot name="actions" />
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
.thread-header-text {
  min-width: 0;
}
</style>
