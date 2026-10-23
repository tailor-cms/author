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
    <div ref="viewportEl" class="reply-viewport overflow-y-auto">
      <div ref="messagesEl" class="py-3">
        <MessageRow
          v-if="parent"
          :current-user-id="currentUserId"
          :message="parent"
          is-reply-target
          @react="(id, emoji) => emit('react', id, emoji)"
          @remove="emit('remove', $event)"
          @update="(id, content) => emit('update', id, content)"
        />
        <div class="d-flex align-center ga-3 px-4 py-2">
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
  currentUserId?: number | null;
  // Opened at and highlighted, e.g. from a search result
  focusedId?: number | null;
}

const props = withDefaults(defineProps<Props>(), {
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

.reply-viewport {
  flex: 0 1 auto;
  min-height: 0;
}

.reply-count {
  font-weight: 600;
  white-space: nowrap;
}

.broadcast-checkbox {
  :deep(.v-label) {
    padding-inline-start: 0.375rem;
    font-size: 0.8125rem;
    opacity: var(--v-medium-emphasis-opacity);
  }
}
</style>
