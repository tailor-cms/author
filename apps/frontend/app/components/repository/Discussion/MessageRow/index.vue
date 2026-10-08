<template>
  <div
    :class="{
      'message-row--grouped': isGrouped,
      'message-row--card': hasCards,
      'message-row--broadcast': message.isBroadcast,
    }"
    class="message-row"
  >
    <!-- Gutter: the sender's avatar, or the time beside a grouped follow-up -->
    <div class="message-row-gutter d-flex align-center">
      <MessageTime
        v-if="isGrouped"
        :at="message.createdAt"
        class="message-row-time text-body-small text-medium-emphasis"
      />
      <SenderAvatar v-else :message="message" :size="AVATAR_SIZE" />
    </div>
    <div class="message-row-content">
      <!-- A reply also sent to the channel, linking back to its replies -->
      <BroadcastNote
        v-if="message.isBroadcast"
        :is-reply-target="isReplyTarget"
        class="mb-1"
        @open="openParent"
      />
      <MessageHeader v-if="!isGrouped" :message="message" />
      <div
        v-if="isDeleted"
        class="text-body-large text-medium-emphasis font-italic"
      >
        This message was deleted.
      </div>
      <MessageEditor
        v-else-if="isEditing"
        :content="message.content"
        @cancel="isEditing = false"
        @save="saveEdit"
      />
      <template v-else>
        <MessagePreviews :content="hasCards ? '' : message.content">
          <MessageBody
            v-if="hasBody || message.editedAt"
            :content="hasBody ? message.content : ''"
            :current-user-id="currentUserId"
            :is-edited="!!message.editedAt"
            class="text-body-large"
          />
        </MessagePreviews>
        <MessageAttachments
          v-if="hasCards"
          :attachments="attachments"
          class="mt-2"
        />
        <MessageReactions
          :current-user-id="currentUserId"
          :reactions="message.reactions"
          class="mt-1"
          @toggle="emit('react', message.id, $event)"
        />
        <ReplyFooter
          v-if="!isReplyTarget && message.replyCount"
          :message="message"
          class="mt-1"
          @open="emit('reply', message.id)"
        />
      </template>
    </div>
    <!-- The toolbar over the row on hover -->
    <MessageActions
      v-if="hasActions"
      :is-author="isOwnMessage"
      :is-reactable="!isDeleted"
      :is-replyable="isReplyable"
      class="message-row-actions"
      @edit="isEditing = true"
      @react="emit('react', message.id, $event)"
      @remove="emit('remove', message.id)"
      @reply="emit('reply', message.id)"
    />
  </div>
</template>

<script lang="ts" setup>
import type { Message } from '@tailor-cms/interfaces/comment';

import {
  MessageBody,
  MessageEditor,
  MessageReactions,
  MessageTime,
  useEditingMessage,
} from '@tailor-cms/core-components';
import BroadcastNote from './BroadcastNote.vue';
import MessageActions from './MessageActions.vue';
import MessageAttachments from './MessageAttachments/index.vue';
import MessageHeader from '../MessageHeader.vue';
import MessagePreviews from '../MessagePreviews/index.vue';
import ReplyFooter from './ReplyFooter.vue';
import SenderAvatar from '../SenderAvatar.vue';

interface Props {
  message: Message;
  currentUserId?: number | null;
  // Follows a message by the same sender, so the header is hidden
  isGrouped?: boolean;
  // Shown in the reply pane, which has no replies of its own
  isReplyTarget?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  currentUserId: null,
  isGrouped: false,
  isReplyTarget: false,
});

const emit = defineEmits<{
  remove: [id: number];
  reply: [id: number];
  react: [id: number, emoji: string];
  update: [id: number, content: string];
}>();

const AVATAR_SIZE = 36;

const isEditing = useEditingMessage(() => props.message.uid);

const saveEdit = (content: string) => {
  isEditing.value = false;
  emit('update', props.message.id, content);
};

// In case of a broadcast reply, open the parent message
const openParent = () => {
  const { parentId } = props.message;
  if (parentId) emit('reply', parentId);
};

const isDeleted = computed(() => !!props.message.deletedAt);
const isReplyable = computed(() => !isDeleted.value && !props.isReplyTarget);
const isOwnMessage = computed(
  () => !isDeleted.value && props.message.author?.id === props.currentUserId,
);
// A deleted message has no available actions
const hasActions = computed(() => !isDeleted.value && !isEditing.value);
// An integration post brings its own cards, drawn instead of previews
const attachments = computed(() => props.message.attachments ?? []);
const hasCards = computed(() => !!attachments.value.length);

// A reporter often sends the card's title as the text as well
const repeatsCardTitle = (text: string) => {
  const title = attachments.value[0]?.title?.trim();
  return !!title && text.toLowerCase() === title.toLowerCase();
};

const hasBody = computed(() => {
  const content = props.message.content?.trim();
  return !!content && !repeatsCardTitle(content);
});
</script>

<style lang="scss" scoped>
.message-row {
  position: relative;
  display: grid;
  grid-template-columns: 3rem 1fr;
  align-items: start;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;

  &:hover,
  &:focus-within {
    background: rgb(var(--v-theme-surface-container-low));

    .message-row-actions,
    .message-row-time {
      opacity: 1;
    }
  }

  &--grouped {
    padding-block: 0.1875rem;
  }

  &--card {
    padding-block: 0.75rem;
  }

  // A reply also sent to the main transcript
  &--broadcast {
    border-inline-start: 0.125rem solid rgba(var(--v-theme-primary), 0.5);
  }
}

.message-row-gutter {
  min-height: 1.25rem;
  // Lines the avatar up with the sender name
  padding-top: 0.125rem;
}

.message-row-content {
  min-width: 0;
  // A readable line length, which also keeps text clear of the toolbar
  max-width: 46rem;
}

// Revealed on hover, with the toolbar
.message-row-time,
.message-row-actions {
  opacity: 0;
  transition: opacity 0.15s ease;
}

// Floats over the top edge
.message-row-actions {
  position: absolute;
  top: -1rem;
  right: 0.75rem;
}
</style>
