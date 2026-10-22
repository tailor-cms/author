<template>
  <div ref="viewportEl" class="thread-timeline flex-grow-1 overflow-y-auto">
    <div ref="messagesEl" class="timeline-entries pt-6">
      <slot name="intro" />
      <section v-for="day in days" :key="day.key" class="timeline-day">
        <VDivider class="day-rule" />
        <VChip
          :text="day.label"
          class="day-chip timeline-divider-chip px-4 font-weight-medium"
          color="surface-raised"
          rounded="pill"
          variant="flat"
          border
        />
        <template v-for="entry in day.entries" :key="entry.key">
          <TimelineDivider
            v-if="entry.type === 'unread'"
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
      </section>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Message } from '@tailor-cms/interfaces/comment';

import { TimelineDivider } from '@tailor-cms/core-components';
import { buildTimeline, groupByDay } from './timeline';
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

const days = computed(() => groupByDay(buildTimeline(props)));

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

.day-rule {
  margin-top: 1.5rem;
}

// Centred on the rule at rest; pinned to the top while its day scrolls by
.day-chip {
  position: sticky;
  z-index: 2;
  top: 0.5rem;
  display: flex;
  width: fit-content;
  margin: -1rem auto 0.75rem;
  font-size: 0.8125rem;
  letter-spacing: 0.01em;
}
</style>
