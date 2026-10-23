<template>
  <div class="thread-intro">
    <h4 class="text-title-large font-weight-semibold">{{ anchor.label }}</h4>
    <p class="text-body-medium text-medium-emphasis mt-1">
      {{ text }}
    </p>
  </div>
</template>

<script lang="ts" setup>
import type { ReaderThread } from '@tailor-cms/api-client';

import { isChannelThread } from '../utils';
import { useThreadAnchor } from '../composables/useThreadAnchor';
import { ThreadType } from '@tailor-cms/interfaces/comment';
import { useDateFormat } from '@vueuse/core';

const props = defineProps<{ thread: ReaderThread }>();

const anchor = useThreadAnchor(() => props.thread);

const startedAt = useDateFormat(() => props.thread.createdAt, 'D MMMM YYYY');

const text = computed(() => {
  const started = `Started ${startedAt.value}.`;
  if (isChannelThread(props.thread)) {
    return `This is the beginning of the conversation. ${started}`;
  }
  const subject =
    props.thread.type === ThreadType.Element ? 'element' : 'activity';
  return `Comments left on this ${subject} collect here. ${started}`;
});
</script>

<style lang="scss" scoped>
.thread-intro {
  padding: 0.25rem 1.5rem;
}
</style>
