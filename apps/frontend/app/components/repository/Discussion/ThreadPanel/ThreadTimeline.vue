<template>
  <MessageViewport
    :focused-id="focusedId"
    :paging-status="pagingStatus"
    :messages="messages"
    class="thread-timeline flex-grow-1"
    @load:older="emit('load:older')"
  >
    <div class="timeline-entries py-6">
      <slot v-if="pagingStatus === PagingStatus.Empty" name="intro" />
      <section v-for="day in days" :key="day.key" class="timeline-day">
        <div
          :class="{ 'unread-divider': startsUnread(day) }"
          class="timeline-rule day-rule"
        >
          <VDivider v-bind="startsUnread(day) ? UNREAD_RULE : {}" />
          <span v-if="startsUnread(day)" class="unread-label mr-6">New</span>
        </div>
        <VChip
          :text="day.label"
          class="day-chip timeline-divider-chip px-4 font-weight-medium"
          color="surface-raised"
          rounded="pill"
          variant="flat"
          border
        />
        <template v-for="(entry, index) in day.entries" :key="entry.key">
          <div
            v-if="entry.type === 'unread' && index"
            class="timeline-rule unread-divider my-4"
          >
            <VDivider v-bind="UNREAD_RULE" />
            <span class="unread-label mr-4">New</span>
          </div>
          <MessageRow
            v-else-if="entry.type === 'message'"
            :current-user-id="currentUserId"
            :is-grouped="entry.isGrouped"
            :is-highlighted="entry.message.id === focusedId"
            :message="entry.message"
            @react="(id, emoji) => emit('react', id, emoji)"
            @remove="emit('remove', $event)"
            @reply="emit('reply', $event)"
            @update="(id, content) => emit('update', id, content)"
          />
        </template>
      </section>
    </div>
  </MessageViewport>
</template>

<script lang="ts" setup>
import type { Message } from '@tailor-cms/interfaces/comment';

import { PagingStatus } from '@/stores/messaging/pages';
import { buildTimeline, groupByDay, type TimelineDay } from './timeline';
import MessageRow from '../MessageRow/index.vue';
import MessageViewport from '../MessageViewport.vue';

interface Props {
  messages: Message[];
  currentUserId?: number | null;
  // Where the reader left off; captured when the thread was opened
  lastReadAt?: string | null;
  // Opened at and highlighted, e.g. from a search result
  focusedId?: number | null;
  pagingStatus?: PagingStatus;
}

const props = withDefaults(defineProps<Props>(), {
  currentUserId: null,
  lastReadAt: null,
  focusedId: null,
  pagingStatus: PagingStatus.Empty,
});

const emit = defineEmits<{
  'load:older': [];
  'remove': [id: number];
  'reply': [id: number];
  'react': [id: number, emoji: string];
  'update': [id: number, content: string];
}>();

const UNREAD_RULE = { color: 'secondary', opacity: 1 };

const days = computed(() => groupByDay(buildTimeline(props)));

// Unread from the day's first message: its rule doubles as the marker
const startsUnread = (day: TimelineDay) => day.entries[0]?.type === 'unread';
</script>

<style lang="scss" scoped>
.thread-timeline {
  min-height: 0;
}

// Capped like the search results; the scrollbar stays at the edge
.timeline-entries {
  width: 100%;
  max-width: 87.5rem;
  margin-inline: auto;
}

// The label overhangs the 1px rule, so it never shifts the line
.timeline-rule {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  height: 1px;
}

.unread-label {
  color: rgb(var(--v-theme-secondary));
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.01em;
}

.day-rule {
  margin-top: 1.75rem;
}

// Centred on the rule at rest; pinned to the top while its day scrolls by
.day-chip {
  position: sticky;
  z-index: 2;
  top: 0.5rem;
  display: flex;
  width: fit-content;
  margin: -1rem auto 0.5rem;
  font-size: 0.8125rem;
  letter-spacing: 0.01em;
}
</style>
