<template>
  <div
    :class="{
      'message-row--grouped': isGrouped,
      'message-row--card': hasCards,
      'message-row--broadcast': message.isBroadcast,
      'message-row--reply': isReplyTarget,
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
      <MessageHeader v-if="!isGrouped && !isEditing" :message="message" />
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
  // Shown in the reply panel, which has no replies of its own
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
  padding: 0.25rem 1.25rem;

  // Hover state layer, tinting whatever surface the row sits on
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: currentColor;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.15s ease;
  }

  &:hover,
  &:focus-within {
    &::after {
      opacity: calc(
        var(--v-hover-opacity) * var(--v-theme-overlay-multiplier)
      );
    }

    .message-row-actions,
    .message-row-time {
      opacity: 1;
    }
  }

  // A new sender gets room above; their follow-ups sit close as one block
  &:not(.message-row--grouped) {
    padding-top: 0.75rem;
  }

  // The narrower replies column
  &--reply {
    padding-inline: 1rem;
  }

  &--card {
    padding-block: 0.75rem;
  }
}

.message-row-gutter {
  min-height: 1.25rem;
  // Lines the avatar up with the sender name
  padding-top: 0.125rem;
}

.message-row-content {
  min-width: 0;
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
  z-index: 1;
  top: -1rem;
  right: 0.75rem;
}
</style>
