<template>
  <div class="reply-panel d-flex flex-column">
    <div class="d-flex flex-shrink-0 align-center ga-2 px-4 py-4">
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
    <div ref="viewportEl" class="flex-grow-1 overflow-y-auto py-3">
      <div ref="messagesEl">
        <MessageRow
          v-if="parent"
          :current-user-id="currentUserId"
          :message="parent"
          is-reply-target
          @react="(id, emoji) => emit('react', id, emoji)"
          @remove="emit('remove', $event)"
          @update="(id, content) => emit('update', id, content)"
        />
        <div v-if="replies.length" class="d-flex align-center ga-3 px-4 py-2">
          <span class="reply-count text-body-small text-medium-emphasis">
            {{ pluralize('reply', replies.length, true) }}
          </span>
          <VDivider />
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
    </div>
    <div class="flex-shrink-0 pt-1 px-4 pb-4">
      <MessageComposer
        placeholder="Reply..."
        @edit:last="editLast"
        @submit="submit"
      />
      <VCheckbox
        v-model="isBroadcast"
        :label="`Also send to ${threadLabel}`"
        class="broadcast-checkbox mt-1"
        hide-details
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Message } from '@tailor-cms/interfaces/comment';

import {
  lastOwnMessage,
  MessageComposer,
  provideEditingMessage,
} from '@tailor-cms/core-components';
import { isContinuation } from './ThreadPanel/timeline';
import { useStickToBottom } from './composables/useStickToBottom';
import pluralize from 'pluralize-esm';
import MessageRow from './MessageRow/index.vue';

interface Props {
  parent: Message | null;
  replies: Message[];
  threadLabel?: string;
  currentUserId?: number | null;
  // Opened at and highlighted, e.g. from a search result
  focusedId?: number | null;
}

const props = withDefaults(defineProps<Props>(), {
  threadLabel: 'the channel',
  currentUserId: null,
  focusedId: null,
});

const emit = defineEmits<{
  close: [];
  submit: [content: string, isBroadcast: boolean];
  remove: [id: number];
  react: [id: number, emoji: string];
  update: [id: number, content: string];
}>();

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

const viewportEl = ref<HTMLElement>();
const messagesEl = ref<HTMLElement>();

useStickToBottom(
  viewportEl,
  messagesEl,
  () => props.replies,
  () => props.focusedId,
);
</script>

<style lang="scss" scoped>
.reply-panel {
  min-width: 0;
  min-height: 0;
}

.reply-count {
  font-weight: 600;
  white-space: nowrap;
}

.broadcast-checkbox {
  :deep(.v-label) {
    font-size: 0.8125rem;
    opacity: var(--v-medium-emphasis-opacity);
  }
}
</style>
