<template>
  <div class="thread-panel d-flex flex-column">
    <ThreadTimeline
      :current-user-id="currentUserId"
      :focused-id="focusedId"
      :last-read-at="lastReadAt"
      :messages="messages"
      @react="(id, emoji) => emit('react', id, emoji)"
      @remove="emit('remove', $event)"
      @reply="emit('reply', $event)"
      @update="(id, content) => emit('update', id, content)"
    >
      <template #intro>
        <ThreadIntro :thread="thread" />
      </template>
    </ThreadTimeline>
    <div class="composer-field">
      <MessageComposer
        v-model="draft"
        :placeholder="messages.length ? 'Reply...' : 'Start the discussion...'"
        class="thread-composer"
        @edit:last="editLast"
        @submit="emit('submit', $event)"
        @typing="emit('typing')"
      />
      <TypingIndicator :users="typingUsers" class="px-2" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ReaderThread } from '@tailor-cms/api-client';
import type { Message } from '@tailor-cms/interfaces/comment';

import {
  lastOwnMessage,
  MessageComposer,
  provideEditingMessage,
} from '@tailor-cms/core-components';
import ThreadIntro from './ThreadIntro.vue';
import ThreadTimeline from './ThreadTimeline.vue';
import TypingIndicator from './TypingIndicator.vue';

interface Props {
  thread: ReaderThread;
  messages: Message[];
  currentUserId?: number | null;
  lastReadAt?: string | null;
  typingUsers?: { id: number; label: string }[];
  // Opened at and highlighted, e.g. from a search result
  focusedId?: number | null;
}

const props = withDefaults(defineProps<Props>(), {
  currentUserId: null,
  lastReadAt: null,
  typingUsers: () => [],
  focusedId: null,
});

const emit = defineEmits<{
  submit: [content: string];
  remove: [id: number];
  reply: [id: number];
  react: [id: number, emoji: string];
  update: [id: number, content: string];
  typing: [];
}>();

// Per thread, kept when switching away & back
const draft = defineModel<string>('draft', { default: '' });

// Up-arrow in the composer opens the reader's last message for editing
const editingUid = provideEditingMessage();

const editLast = () => {
  const last = lastOwnMessage(props.messages, props.currentUserId);
  if (last) editingUid.value = last.uid;
};
</script>

<style lang="scss" scoped>
.thread-panel {
  min-width: 0;
  min-height: 0;
}

.composer-field {
  padding: 0 1.25rem;

  .typing-indicator {
    padding-top: 0.125rem;
    padding-bottom: 0.25rem;
  }
}

.thread-composer {
  --composer-min-height: 1.75rem;
}
</style>
