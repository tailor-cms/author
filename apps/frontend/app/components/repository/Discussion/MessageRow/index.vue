<template>
  <div
    :class="{
      'message-row--grouped': isGrouped,
      'message-row--card': hasCards,
      'message-row--broadcast': message.isBroadcast,
      'message-row--reply': isReplyTarget,
      'message-row--highlighted': isHighlighted,
    }"
    :data-message-id="message.id"
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
      <!-- A reply also sent to the thread, linking back to its replies -->
      <BroadcastNote
        v-if="message.isBroadcast"
        :is-reply-target="isReplyTarget"
        class="mb-1"
        @open="openParent"
      />
      <MessageHeader
        v-if="!isGrouped && !isEditing"
        :has-day="isReplyTarget"
        :message="message"
      />
      <div v-if="isDeleted" class="deleted text-medium-emphasis">
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
          class="my-1"
        />
        <MessageReactions
          :current-user-id="currentUserId"
          :reactions="message.reactions"
          class="mt-1"
          @toggle="emit('react', message.id, $event)"
        />
      </template>
      <!-- Kept on a deleted message, so its replies stay reachable -->
      <ReplyFooter
        v-if="!isReplyTarget && !isEditing && message.replyCount"
        :message="message"
        class="mt-1"
        @open="emit('reply', message.id)"
      />
    </div>
    <!-- The toolbar over the row on hover -->
    <MessageActions
      v-if="hasActions"
      :is-author="isOwnMessage"
      :is-reactable="!isDeleted"
      :is-replyable="isReplyable"
      :is-broadcast="message.isBroadcast"
      :is-broadcastable="isBroadcastable"
      class="message-row-actions"
      @edit="isEditing = true"
      @react="emit('react', message.id, $event)"
      @remove="emit('remove', message.id)"
      @reply="emit('reply', message.id)"
      @set:broadcast="emit('set:broadcast', message.id, $event)"
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
  // Jumped to, e.g. from a search result
  isHighlighted?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  currentUserId: null,
  isGrouped: false,
  isReplyTarget: false,
  isHighlighted: false,
});

const emit = defineEmits<{
  'remove': [id: number];
  'reply': [id: number];
  'react': [id: number, emoji: string];
  'update': [id: number, content: string];
  'set:broadcast': [id: number, isBroadcast: boolean];
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
const isBroadcastable = computed(
  () => isOwnMessage.value && !!props.message.parentId,
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
  --row-overlap: 0.25rem;
  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-columns: 3rem 1fr;
  align-items: start;
  margin-block: calc(-2 * var(--row-overlap));
  padding: 0.5rem 1.25rem;

  .deleted {
    font-size: 0.875rem;
    font-style: italic;
  }

  // Hover state layer, tinting whatever surface the row sits on
  // while staying under the row's cards
  &::after {
    content: '';
    position: absolute;
    z-index: -1;
    inset: var(--row-overlap) 0;
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

  &--highlighted {
    animation: message-highlight 2s ease-out;
  }

  &--reply {
    .message-row-actions {
      right: 1rem;
    }
  }
}

@keyframes message-highlight {
  0%,
  40% {
    background: rgba(var(--v-theme-tertiary), 0.16);
  }

  100% {
    background: transparent;
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
  top: calc(var(--row-overlap) - 1rem);
  right: 1.25rem;
}
</style>
