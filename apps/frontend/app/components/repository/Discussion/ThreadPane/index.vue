<template>
  <div class="thread-pane d-flex flex-column">
    <ThreadHeader :participants="participants" :thread="thread">
      <template #actions>
        <ThreadMenu
          :thread="thread"
          @open:files="emit('open:files')"
          @open:subscriptions="emit('open:subscriptions')"
          @remove:thread="emit('remove:thread')"
          @resolve="emit('resolve', $event)"
          @star="emit('star', $event)"
        />
      </template>
    </ThreadHeader>
    <VDivider />
    <ThreadTimeline
      :current-user-id="currentUserId"
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
    <TypingIndicator :users="typingUsers" class="px-5" />
    <div class="pt-1 px-4 pb-4">
      <MessageComposer
        v-model="draft"
        :placeholder="messages.length ? 'Reply...' : 'Start the discussion...'"
        class="thread-composer"
        @edit:last="editLast"
        @submit="emit('submit', $event)"
        @typing="emit('typing')"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ReaderThread } from '@tailor-cms/api-client';
import type { Message } from '@tailor-cms/interfaces/comment';

import {
  MessageComposer,
  provideEditingMessage,
} from '@tailor-cms/core-components';
import { compact, uniqBy } from 'lodash-es';
import { lastOwnMessage } from '../utils';
import ThreadHeader from './ThreadHeader.vue';
import ThreadIntro from './ThreadIntro.vue';
import ThreadMenu from './ThreadMenu.vue';
import ThreadTimeline from './ThreadTimeline.vue';
import TypingIndicator from './TypingIndicator.vue';

interface Props {
  thread: ReaderThread;
  messages: Message[];
  currentUserId?: number | null;
  lastReadAt?: string | null;
  typingUsers?: { id: number; label: string }[];
}

const props = withDefaults(defineProps<Props>(), {
  currentUserId: null,
  lastReadAt: null,
  typingUsers: () => [],
});

const emit = defineEmits<{
  'submit': [content: string];
  'remove': [id: number];
  'reply': [id: number];
  'react': [id: number, emoji: string];
  'update': [id: number, content: string];
  'typing': [];
  'resolve': [isResolved: boolean];
  'star': [isStarred: boolean];
  'remove:thread': [];
  'open:files': [];
  'open:subscriptions': [];
}>();

// Per thread, kept when switching away & back
const draft = defineModel<string>('draft', { default: '' });

// Up-arrow in the composer opens the reader's last message for editing
const editingUid = provideEditingMessage();

const editLast = () => {
  const last = lastOwnMessage(props.messages, props.currentUserId);
  if (last) editingUid.value = last.uid;
};

const participants = computed(() =>
  uniqBy(compact(props.messages.map((it) => it.author)), 'id'),
);
</script>

<style lang="scss" scoped>
.thread-pane {
  min-width: 0;
  min-height: 0;
}

.thread-composer {
  --composer-min-height: 3.5rem;
}
</style>
