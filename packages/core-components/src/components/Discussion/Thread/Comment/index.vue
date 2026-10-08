<template>
  <div class="comment ma-2">
    <UserAvatar
      v-if="comment.author"
      :img-url="comment.author.imgUrl"
      :size="34"
    />
    <div class="comment-main">
      <CommentHeader
        v-bind="{
          comment,
          isActivityThread,
          isEditing,
          isResolved,
          elementLabel,
          user,
        }"
        @remove="remove"
        @resolve="handleResolvementUpdate"
        @enable-edit="isEditing = true"
        @react="emit('react', comment, $event)"
      />
      <div class="comment-body">
        <CommentPreview
          v-if="!isEditing"
          v-bind="{
            content: comment.content,
            currentUserId: user?.id,
            isResolved,
            isDeleted,
            isEdited,
          }"
          @unresolve="handleResolvementUpdate"
        />
        <MessageEditor
          v-else
          :content="comment.content"
          class="comment-editor mt-3"
          placeholder="Edit your comment..."
          @cancel="isEditing = false"
          @save="save"
        />
        <MessageReactions
          v-if="!isEditing"
          :current-user-id="user?.id"
          :reactions="comment.reactions"
          class="mt-1"
          @toggle="emit('react', comment, $event)"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Comment } from '@tailor-cms/interfaces/comment';
import type { User } from '@tailor-cms/interfaces/user';

import { computed } from 'vue';
import { useEditingMessage } from '../../context';
import CommentHeader from './CommentHeader.vue';
import CommentPreview from './CommentPreview.vue';
import MessageEditor from '../../MessageEditor.vue';
import MessageReactions from '../../MessageReactions.vue';
import UserAvatar from '../../../UserAvatar.vue';

interface Props {
  user: User;
  comment: Comment;
  isActivityThread?: boolean;
  elementLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  isActivityThread: false,
  elementLabel: '',
});

const emit = defineEmits([
  'remove',
  'resolve',
  'unresolve',
  'update',
  'react',
]);

// Opening one comment for editing closes any other
const isEditing = useEditingMessage(() => props.comment.uid);

const isResolved = computed(() => !!props.comment.resolvedAt);
const isDeleted = computed(() => !!props.comment.deletedAt);
const isEdited = computed(() => !!props.comment.editedAt);

const save = (content: string) => {
  isEditing.value = false;
  emit('update', props.comment, content);
};

const remove = () => {
  emit('remove', props.comment);
};

const handleResolvementUpdate = () => {
  emit(isResolved.value ? 'unresolve' : 'resolve', props.comment);
};
</script>

<style lang="scss" scoped>
.comment {
  display: flex;
  gap: 0.75rem;
  transition: background-color 0.2s ease-in-out;

  &-main {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
  }

  &-editor :deep(.composer-input) {
    font-size: 0.875rem;
  }
}
</style>
