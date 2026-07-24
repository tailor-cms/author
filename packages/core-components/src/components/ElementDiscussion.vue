<template>
  <VMenu
    v-model="isVisible"
    :close-on-content-click="false"
    :persistent="isConfirmationActive"
    class="element-discussion"
    location="left"
    width="450"
    offset="4"
    transition="slide-y-transition"
  >
    <template #activator="{ props: menuProps }">
      <VBtn
        v-tooltip:left="{ text: activator.tooltip, openDelay: 1000 }"
        v-bind="menuProps"
        :icon="activator?.icon"
        aria-label="View comments"
        size="x-small"
        variant="tonal"
      />
    </template>
    <VSheet :theme="$vuetify.theme.global.name" class="pa-4" rounded="lg">
      <Discussion
        v-bind="{
          comments,
          unseenComments,
          hasUnresolvedComments,
          user,
          isVisible,
        }"
        v-model:confirmation-active="isConfirmationActive"
        @remove="removeComment"
        @resolve="updateResolvement"
        @save="save"
        @seen="setLastSeen"
        @unresolve="updateResolvement"
        @update="save"
      />
    </VSheet>
  </VMenu>
</template>

<script lang="ts" setup>
import { computed, inject, ref } from 'vue';
import type { Comment } from '@tailor-cms/interfaces/comment';
import { Events } from '@tailor-cms/utils';
import { get } from 'lodash-es';
import type { User } from '@tailor-cms/interfaces/user';

import Discussion from './Discussion/index.vue';

const getActivatorOptions = (unseenComments: Comment[]) => ({
  unseen: {
    tooltip: 'View new comments',
    icon:
      unseenComments.length > 9
        ? 'mdi-numeric-9-plus-box-multiple'
        : `mdi-numeric-${unseenComments.length}-box-multiple`,
  },
  preview: {
    icon: 'mdi-comment-text-multiple-outline',
    tooltip: 'View comments',
  },
  post: {
    icon: 'mdi-message-plus-outline',
    tooltip: 'Post a comment',
  },
});

interface Props {
  uid: string;
  activityId: number;
  repositoryId: number;
  comments?: Comment[];
  lastSeen?: number | null;
  user: User;
  id?: number | null;
  hasUnresolvedComments?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  id: null,
  comments: () => [],
  lastSeen: null,
  hasUnresolvedComments: false,
});

const isVisible = ref(false);
const isConfirmationActive = ref(false);

const editorBus = inject<any>('$editorBus');

const lastCommentAt = computed(() =>
  new Date(get(props.comments[0], 'createdAt', 0)).getTime(),
);

const unseenComments = computed(() => {
  return props.comments.filter((it) => {
    const createdAt = new Date(it.createdAt).getTime();
    const isAuthor = it.author.id !== props.user.id;
    return isAuthor && props.lastSeen && createdAt > props.lastSeen;
  });
});

const activator = computed(() => {
  const type = unseenComments.value.length
    ? 'unseen'
    : props.comments.length
      ? 'preview'
      : 'post';
  return getActivatorOptions(unseenComments.value)[type];
});

const save = (data: Partial<Comment>) => {
  return editorBus.emit('comment', {
    action: Events.Discussion.Save,
    payload: {
      ...data,
      author: props.user,
      contentElementId: props.id,
      hasUnresolvedComments: props.hasUnresolvedComments,
    },
  });
};

const setLastSeen = (timeout: number) => {
  editorBus.emit('comment', {
    action: Events.Discussion.SetLastSeen,
    payload: {
      elementUid: props.uid,
      lastCommentAt: lastCommentAt.value,
      timeout,
    },
  });
};

// Resolve all if id is not provided
const updateResolvement = ({
  id,
  resolvedAt,
}: { id?: number; resolvedAt?: number } = {}) => {
  editorBus.emit('comment', {
    action: Events.Discussion.Resolve,
    payload: {
      id,
      contentElementId: props.id,
      resolvedAt,
    },
  });
};

const removeComment = (id: number) => {
  editorBus.emit('comment', {
    action: Events.Discussion.Remove,
    payload: id,
  });
};
</script>
