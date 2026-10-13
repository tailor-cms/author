<template>
  <div class="header">
    <div class="comment-info">
      <span
        v-if="comment.author"
        v-tooltip:right="comment.author.label"
        class="author text-label-large text-truncate font-weight-semibold"
      >
        {{ comment.author.label }}
      </span>
      <div class="meta d-flex align-center text-label-medium text-medium-emphasis">
        <MessageTime :at="comment.createdAt" is-relative />
        <EditorLink
          v-if="
            isActivityThread
              && elementLabel
              && !isDeleted
              && comment.activityId != null
          "
          :activity-id="comment.activityId"
          :element-uid="elementUid"
          :label="elementLabel"
          class="ml-1"
        />
      </div>
    </div>
    <AddReactionButton
      v-if="!isDeleted && !isEditing"
      density="comfortable"
      size="x-small"
      @select="emit('react', $event)"
    />
    <VMenu
      v-if="showOptions && !isEditing"
      :close-on-content-click="false"
      location="bottom end"
    >
      <template #activator="{ props: menuProps }">
        <VBtn
          v-bind="menuProps"
          aria-label="Comment actions"
          class="actions"
          density="comfortable"
          icon="mdi-dots-vertical"
          size="x-small"
          variant="text"
        />
      </template>
      <template #default="{ isActive }">
        <VList density="compact" nav>
          <VListItem
            v-for="{ action, icon, label, color } in options"
            :key="action"
            :base-color="color"
            :prepend-icon="`mdi-${icon}`"
            :title="label"
            @click="isActive.value = false; emit(action)"
          />
        </VList>
      </template>
    </VMenu>
  </div>
</template>

<script lang="ts" setup>
import type { Comment } from '@tailor-cms/interfaces/comment';
import type { User } from '@tailor-cms/interfaces/user';

import { computed } from 'vue';
import AddReactionButton from '../../Reactions/AddReactionButton.vue';
import EditorLink from '../../../EditorLink.vue';
import MessageTime from '../../Message/MessageTime.vue';

type Action = 'resolve' | 'enableEdit' | 'remove';

interface Option {
  action: Action;
  label: string;
  icon: string;
  color?: string;
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

const emit = defineEmits(['remove', 'resolve', 'enableEdit', 'react']);

const OPTIONS = {
  resolve: {
    label: 'Resolve',
    action: 'resolve',
    icon: 'checkbox-outline',
  },
  edit: {
    label: 'Edit',
    action: 'enableEdit',
    icon: 'square-edit-outline',
  },
  remove: {
    label: 'Remove',
    action: 'remove',
    icon: 'trash-can-outline',
    color: 'error',
  },
} satisfies Record<string, Option>;

const elementUid = computed(() => props.comment.contentElement?.uid);
const isAuthor = computed(() => props.comment.author?.id === props.user?.id);
const isDeleted = computed(() => !!props.comment.deletedAt);

const options = computed<Option[]>(() => {
  const { resolve, edit, remove } = OPTIONS;
  const authorOptions = isAuthor.value ? [edit, remove] : [];
  return props.isActivityThread ? authorOptions : [resolve, ...authorOptions];
});

const showOptions = computed(
  () => options.value.length > 0 && !isDeleted.value && !props.isResolved,
);
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  align-items: flex-start;
  gap: 0.25rem;

  .comment-info {
    display: flex;
    flex: 1;
    flex-wrap: wrap;
    align-items: baseline;
    column-gap: 0.375rem;
    min-width: 0;

    .author {
      flex: 0 1 auto;
      min-width: 0;
      color: rgb(var(--v-theme-on-surface));
    }

    .meta {
      flex: none;
      line-height: 1.2;
    }

    :deep(.editor-link) {
      display: inline-flex;
    }
  }
}
</style>
