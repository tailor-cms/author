<template>
  <div class="header">
    <UserAvatar
      v-if="comment.author"
      :img-url="comment.author.imgUrl"
      :size="36"
      class="ml-1 mt-2"
      color="primary-lighten-4"
    />
    <div class="info-container">
      <div v-if="comment.author" class="d-flex align-center">
        <VTooltip location="right">
          <template #activator="{ props: tooltipProps }">
            <span
              v-bind="tooltipProps"
              class="author text-teal-lighten-5 text-truncate"
            >
              {{ comment.author.label }}
            </span>
          </template>
          {{ comment.author.label }}
        </VTooltip>
        <span v-if="showEditedLabel" class="edited ml-1">(edited)</span>
      </div>
      <div class="d-flex text-grey-lighten-2 align-center">
        <VTooltip location="right">
          <template #activator="{ props: tooltipProps }">
            <span v-bind="tooltipProps" class="text-subtitle-2">
              {{ formatDistanceToNow(comment.createdAt) }} ago
            </span>
          </template>
          <span>
            {{ formatDate(comment.createdAt, 'dd MMM HH:mm') }}
          </span>
        </VTooltip>
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
    <div v-if="showOptions" class="actions">
      <VBtn
        v-for="{ action, icon, color } in options"
        :key="action"
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

type Action = 'resolve' | 'toggleEdit' | 'remove';

interface Option {
  action: Action;
  icon: string;
  color: string;
}

interface Props {
  user: User;
  comment: Comment;
  isActivityThread?: boolean;
  isResolved?: boolean;
  elementLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  isActivityThread: false,
  isResolved: false,
  elementLabel: '',
});

const emit = defineEmits(['remove', 'resolve', 'toggleEdit']);

const OPTIONS: Record<string, Option> = {
  resolve: {
    action: 'resolve',
    icon: 'checkbox-outline',
    color: 'primary-lighten-3',
  },
  edit: {
    action: 'toggleEdit',
    icon: 'pencil-outline',
    color: 'teal-lighten-3',
  },
  remove: {
    action: 'remove',
    icon: 'trash-can-outline',
    color: 'secondary-lighten-3',
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

  .info-container {
    display: flex;
    flex-direction: column;
    flex: 0 100%;
    max-width: calc(100% - 12rem);
    margin-left: 0.75rem;

    .author {
      display: inline-block;
      max-width: 75%;
      font-size: 1rem;
    }

    .edited,
    .time {
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
