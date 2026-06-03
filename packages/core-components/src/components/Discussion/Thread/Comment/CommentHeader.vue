<template>
  <div class="header">
    <UserAvatar
      v-if="comment.author"
      :img-url="comment.author.imgUrl"
      :size="36"
      class="mt-1"
    />
    <div class="comment-info">
      <div v-if="comment.author" class="d-flex align-center">
        <span v-tooltip:right="comment.author.label" class="author text-truncate">
          {{ comment.author.label }}
        </span>
        <span v-if="showEditedLabel" class="edited ml-1">(edited)</span>
      </div>
      <div class="d-flex align-center">
        <span
          v-tooltip:right="formatDate(comment.createdAt, 'dd MMM HH:mm')"
          class="time text-label-large text-medium-emphasis"
        >
          {{ formatDistanceToNow(comment.createdAt) }} ago
        </span>
        <template v-if="isActivityThread && elementLabel">
          <EditorLink
            v-if="!isDeleted"
            :activity-id="comment.activityId"
            :element-uid="elementUid"
            :label="elementLabel"
            class="ml-1"
          />
        </template>
      </div>
    </div>
    <div v-if="showOptions && !isEditing" class="actions">
      <VBtn
        v-for="{ action, icon, label, color } in options"
        :key="action"
        :aria-label="label"
        :color="color"
        :icon="`mdi-${icon}`"
        class="ml-2"
        size="x-small"
        variant="tonal"
        @click="emit(action)"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Comment } from '@tailor-cms/interfaces/comment';
import { computed } from 'vue';
import { formatDate } from 'date-fns/format';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import type { User } from '@tailor-cms/interfaces/user';

import EditorLink from '../../../EditorLink.vue';
import UserAvatar from '../../..//UserAvatar.vue';

type Action = 'resolve' | 'enableEdit' | 'remove';

interface Option {
  action: Action;
  label: string;
  icon: string;
  color: string;
}

interface Props {
  user: User;
  comment: Comment;
  isActivityThread?: boolean;
  isResolved?: boolean;
  isEditing?: boolean;
  elementLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  isActivityThread: false,
  isResolved: false,
  isEditing: false,
  elementLabel: '',
});

const emit = defineEmits(['remove', 'resolve', 'enableEdit']);

const OPTIONS: Record<string, Option> = {
  resolve: {
    label: 'Resolve comment',
    action: 'resolve',
    icon: 'checkbox-outline',
    color: '',
  },
  edit: {
    label: 'Edit comment',
    action: 'enableEdit',
    icon: 'pencil-outline',
    color: 'secondary',
  },
  remove: {
    label: 'Remove comment',
    action: 'remove',
    icon: 'trash-can-outline',
    color: 'error',
  },
};

const elementUid = computed(() => props.comment.contentElement?.uid);
const isAuthor = computed(() => props.comment.author?.id === props.user?.id);
const isDeleted = computed(() => !!props.comment.deletedAt);
const showEditedLabel = computed(() => !!props.comment.editedAt);
const showOptions = computed(
  () => isAuthor.value && !isDeleted.value && !props.isResolved,
);
const options = computed(() => {
  const { resolve, edit, remove } = OPTIONS;
  return props.isActivityThread ? [edit, remove] : [resolve, edit, remove];
});
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  align-items: flex-start;

  .comment-info {
    display: flex;
    flex-direction: column;
    flex: 0 100%;
    max-width: calc(100% - 8rem);
    margin-left: 0.75rem;

    .author {
      display: inline-block;
      max-width: 75%;
      font-size: 1rem;
    }

    .edited {
      font-size: 0.75rem;
    }

    hr.v-divider--vertical {
      margin: 0.25rem 0.125rem 0.125rem 0.625rem;
    }

    :deep(.editor-link) {
      display: inline-flex;
      align-self: flex-end;
    }
  }

  .actions {
    margin-left: auto;
  }
}
</style>
