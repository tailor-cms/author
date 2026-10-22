<template>
  <div ref="viewportEl" class="thread-timeline flex-grow-1 overflow-y-auto pt-6">
    <div ref="messagesEl" class="timeline-entries">
      <slot name="intro" />
      <template v-for="entry in entries" :key="entry.key">
        <TimelineDivider
          v-if="entry.type === 'day'"
          :text="entry.label"
          class="my-6"
        />
        <TimelineDivider
          v-else-if="entry.type === 'unread'"
          class="unread-divider my-6"
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

import { TimelineDivider } from '@tailor-cms/core-components';
import { buildTimeline } from './timeline';
import { useStickToBottom } from '../composables/useStickToBottom';
import MessageRow from '../MessageRow/index.vue';

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

const viewportEl = ref<HTMLElement>();
const messagesEl = ref<HTMLElement>();

useStickToBottom(viewportEl, messagesEl, () => props.messages);
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
