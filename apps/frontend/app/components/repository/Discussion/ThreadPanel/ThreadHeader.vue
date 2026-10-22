<template>
  <div class="d-flex align-center ga-3 px-5 py-3">
    <div class="thread-header-text">
      <div class="d-flex align-center ga-2">
        <h3 class="thread-title text-title-medium font-weight-bold text-truncate">
          {{ title }}
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
      <VChip
        v-if="!isChannelThread(thread)"
        :append-icon="anchor.href ? 'mdi-arrow-top-right-thick' : undefined"
        :href="anchor.href"
        :prepend-icon="anchor.icon"
        :text="anchor.label"
        class="anchor-chip mt-2"
        density="comfortable"
        size="small"
        variant="tonal"
        rounded="xl"
        label
      />
    </div>
    <VSpacer />
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

const anchor = useThreadAnchor(() => props.thread);

const title = computed(
  () =>
    props.thread.title || props.thread.activity?.data?.name || 'Discussion',
);
</script>

<style lang="scss" scoped>
.thread-header-text {
  min-width: 0;
}

.anchor-chip {
  max-width: 100%;

  :deep(.v-chip__content) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
