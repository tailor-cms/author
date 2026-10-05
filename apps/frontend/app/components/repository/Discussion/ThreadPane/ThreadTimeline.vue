<template>
  <div ref="scrollEl" class="thread-timeline flex-grow-1 overflow-y-auto py-3">
    <div class="timeline-entries">
      <slot name="intro" />
      <template v-for="entry in entries" :key="entry.key">
        <TimelineDivider v-if="entry.type === 'day'" :text="entry.label" />
        <TimelineDivider
          v-else-if="entry.type === 'unread'"
          class="unread-divider"
          color="secondary"
          icon="mdi-arrow-down"
          text="New"
        />
        <MessageRow
          v-else
          :current-user-id="currentUserId"
          :is-grouped="entry.isGrouped"
          :message="entry.message"
          @react="(id, emoji) => emit('react', id, emoji)"
          @remove="emit('remove', $event)"
          @reply="emit('reply', $event)"
          @update="(id, content) => emit('update', id, content)"
        />
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Message } from '@tailor-cms/interfaces/comment';

import MessageRow from '../MessageRow/index.vue';
import TimelineDivider from './TimelineDivider.vue';
import { buildTimeline } from './timeline';

interface Props {
  messages: Message[];
  currentUserId?: number | null;
  // Where the reader left off; captured when the thread was opened
  lastReadAt?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  currentUserId: null,
  lastReadAt: null,
});

const emit = defineEmits<{
  remove: [id: number];
  reply: [id: number];
  react: [id: number, emoji: string];
  update: [id: number, content: string];
}>();

const entries = computed(() => buildTimeline(props));

const scrollEl = ref<HTMLElement>();

const scrollToBottom = async () => {
  await nextTick();
  const el = scrollEl.value;
  if (el) el.scrollTop = el.scrollHeight;
};

watch(() => props.messages.length, scrollToBottom, { immediate: true });
</script>

<style lang="scss" scoped>
.thread-timeline {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.timeline-entries {
  margin-top: auto;
}
</style>
