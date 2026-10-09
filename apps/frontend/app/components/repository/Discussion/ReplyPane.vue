<template>
  <div class="reply-pane d-flex flex-column">
    <div class="d-flex flex-shrink-0 align-center ga-2 px-4 py-3">
      <h3 class="text-title-medium font-weight-bold">Thread</h3>
      <VSpacer />
      <VBtn
        v-tooltip:left="'Close thread'"
        aria-label="Close thread"
        density="comfortable"
        icon="mdi-close"
        size="small"
        variant="text"
        @click="emit('close')"
      />
    </div>
    <VDivider />
    <div ref="scrollEl" class="flex-grow-1 overflow-y-auto py-3">
      <MessageRow
        v-if="parent"
        :current-user-id="currentUserId"
        :message="parent"
        is-reply-target
        @react="(id, emoji) => emit('react', id, emoji)"
        @remove="emit('remove', $event)"
        @update="(id, content) => emit('update', id, content)"
      />
      <div class="px-4 py-2 text-body-small text-medium-emphasis font-weight-bold">
        {{ pluralize('reply', replies.length, true) }}
      </div>
      <VDivider class="mb-2" />
      <MessageRow
        v-for="reply in replies"
        :key="reply.uid"
        :current-user-id="currentUserId"
        :message="reply"
        is-reply-target
        @react="(id, emoji) => emit('react', id, emoji)"
        @remove="emit('remove', $event)"
        @update="(id, content) => emit('update', id, content)"
      />
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
        density="compact"
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
import pluralize from 'pluralize-esm';
import MessageRow from './MessageRow/index.vue';

interface Props {
  parent: Message | null;
  replies: Message[];
  threadLabel?: string;
  currentUserId?: number | null;
}

const props = withDefaults(defineProps<Props>(), {
  threadLabel: 'the channel',
  currentUserId: null,
});

const emit = defineEmits<{
  close: [];
  submit: [content: string, isBroadcast: boolean];
  remove: [id: number];
  react: [id: number, emoji: string];
  update: [id: number, content: string];
}>();

const scrollEl = ref<HTMLElement>();

// If a message is being edited
const editingUid = provideEditingMessage();

const editLast = () => {
  const last = lastOwnMessage(props.replies, props.currentUserId);
  if (last) editingUid.value = last.uid;
};

// Post to the channel as well
const isBroadcast = ref(false);

const submit = (content: string) => {
  emit('submit', content, isBroadcast.value);
  isBroadcast.value = false;
};

const scrollToBottom = async () => {
  await nextTick();
  const el = scrollEl.value;
  if (el) el.scrollTop = el.scrollHeight;
};

watch(() => props.replies.length, scrollToBottom, { immediate: true });
</script>

<style lang="scss" scoped>
.reply-pane {
  min-width: 0;
  min-height: 0;
  background: rgb(var(--v-theme-surface));
}

.broadcast-checkbox {
  :deep(.v-label) {
    font-size: 0.8125rem;
    opacity: var(--v-medium-emphasis-opacity);
  }
}
</style>
