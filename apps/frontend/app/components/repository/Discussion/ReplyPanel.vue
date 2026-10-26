<template>
  <div class="reply-panel d-flex flex-column">
    <div class="d-flex flex-shrink-0 align-center ga-2 px-4 pt-4">
      <h3 class="text-title-medium font-weight-bold">Replies</h3>
      <VSpacer />
      <VBtn
        v-tooltip:left="'Close replies'"
        aria-label="Close replies"
        density="comfortable"
        icon="mdi-close"
        size="small"
        variant="text"
        @click="emit('close')"
      />
    </div>
    <MessageViewport
      :focused-id="focusedId"
      :paging="paging"
      :messages="replies"
      class="reply-viewport"
      @jump:latest="emit('jump:latest')"
      @load:newer="emit('load:newer')"
      @load:older="emit('load:older')"
    >
      <div class="py-5">
        <MessageRow
          v-if="parent"
          :current-user-id="currentUserId"
          :message="parent"
          is-reply-target
          @react="(id, emoji) => emit('react', id, emoji)"
          @remove="emit('remove', $event)"
          @update="(id, content) => emit('update', id, content)"
        />
        <div v-if="replyCount > 0" class="d-flex align-center ga-3 px-4 py-2">
          <span class="reply-count text-body-small text-medium-emphasis">
            {{ pluralize('reply', replyCount, true) }}
          </span>
          <VDivider />
        </div>
        <div v-if="isLoadingSlow" class="d-flex justify-center py-6">
          <VProgressCircular aria-label="Loading replies" indeterminate />
        </div>
        <MessageRow
          v-for="(reply, index) in replies"
          :key="reply.uid"
          :current-user-id="currentUserId"
          :is-grouped="isGrouped(index)"
          :is-highlighted="reply.id === focusedId"
          :message="reply"
          is-reply-target
          @react="(id, emoji) => emit('react', id, emoji)"
          @remove="emit('remove', $event)"
          @update="(id, content) => emit('update', id, content)"
        />
      </div>
    </MessageViewport>
    <div class="flex-shrink-0 px-4 pb-2">
      <MessageComposer
        placeholder="Reply..."
        @edit:last="editLast"
        @submit="submit"
      />
      <VCheckboxBtn
        v-model="isBroadcast"
        label="Also send to thread"
        class="broadcast-checkbox mt-2"
        density="compact"
        inline
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Message } from '@tailor-cms/interfaces/comment';

import { NO_PAGING, type Paging } from '@/stores/messaging/pages';
import {
  lastOwnMessage,
  MessageComposer,
  provideEditingMessage,
} from '@tailor-cms/core-components';
import { isContinuation } from './ThreadPanel/timeline';
import pluralize from 'pluralize-esm';
import MessageRow from './MessageRow/index.vue';
import MessageViewport from './MessageViewport.vue';

interface Props {
  parent: Message | null;
  replies: Message[];
  currentUserId?: number | null;
  // Opened at and highlighted, e.g. from a search result
  focusedId?: number | null;
  // The first page is still on the way
  isLoading?: boolean;
  paging?: Paging;
}

const props = withDefaults(defineProps<Props>(), {
  currentUserId: null,
  focusedId: null,
  isLoading: false,
  paging: () => NO_PAGING,
});

const emit = defineEmits<{
  'load:older': [];
  'load:newer': [];
  'jump:latest': [];
  'close': [];
  'submit': [content: string, isBroadcast: boolean];
  'remove': [id: number];
  'react': [id: number, emoji: string];
  'update': [id: number, content: string];
}>();

// Counted by the server, as only a page of replies may be loaded
const replyCount = computed(() =>
  Math.max(props.parent?.replyCount ?? 0, props.replies.length),
);

const isLoadingSlow = useDelayedLoading(() => props.isLoading);

// If a message is being edited
const editingUid = provideEditingMessage();

const editLast = () => {
  const last = lastOwnMessage(props.replies, props.currentUserId);
  if (last) editingUid.value = last.uid;
};

const isGrouped = (index: number) =>
  index > 0 && isContinuation(props.replies[index - 1]!, props.replies[index]!);

// Post to the channel as well
const isBroadcast = ref(false);

const submit = (content: string) => {
  emit('submit', content, isBroadcast.value);
  isBroadcast.value = false;
};
</script>

<style lang="scss" scoped>
.reply-panel {
  min-width: 0;
  min-height: 0;
}

.reply-viewport {
  flex: 0 1 auto;
  min-height: 0;
}

.reply-count {
  font-weight: 600;
  white-space: nowrap;
}

.broadcast-checkbox {
  --v-selection-control-size: 1.5rem;

  :deep(.v-icon) {
    font-size: 1.125rem;
  }

  :deep(.v-label) {
    padding-inline-start: 0.25rem;
    font-size: 0.75rem;
    opacity: var(--v-medium-emphasis-opacity);
  }
}
</style>
