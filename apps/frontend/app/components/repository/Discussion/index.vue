<template>
  <VSheet v-bind="sheetStyles" class="activity-discussion py-2">
    <ActivityDiscussion
      v-bind="{ comments, unseenComments, showHeading, user }"
      scroll-target="inputContainer"
      is-activity-thread
      show-notifications
      @remove="remove"
      @save="saveComment"
      @seen="setLastSeenComment"
      @unresolve="updateResolvement"
      @update="saveComment"
    />
  </VSheet>
</template>

<script lang="ts" setup>
import { get, orderBy } from 'lodash-es';
import { Discussion as ActivityDiscussion } from '@tailor-cms/core-components';
import type { Comment } from '@tailor-cms/interfaces/comment';
import { computed } from 'vue';
import type { User } from '@tailor-cms/interfaces/user';

import { useAuthStore } from '@/stores/auth';
import { useCommentStore } from '@/stores/comments';

interface Props {
  activity: StoreActivity;
  panel?: boolean;
  showHeading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  panel: false,
  showHeading: false,
});

const { $ceRegistry } = useNuxtApp();
provide('$ceRegistry', $ceRegistry);

const authStore = useAuthStore();
const commentStore = useCommentStore();

const user = computed(() => authStore.user as User);

const comments = computed(() => {
  const comments = commentStore.getActivityComments(props.activity.id);
  return orderBy(comments, 'createdAt', 'desc');
});

const unseenComments = computed(() =>
  commentStore.getUnseenActivityComments(props.activity),
);

const lastCommentAt = computed(() =>
  new Date(get(comments.value[0], 'createdAt', 0)).getTime(),
);

const sheetStyles = computed(() =>
  props.panel ? { color: 'primary-darken-2' } : { color: 'transparent' },
);

const saveComment = (comment: any) => {
  const { activity } = props;
  return commentStore.save({
    ...comment,
    author: user.value,
    repositoryId: activity.repositoryId,
    activityId: activity.id,
  });
};

const setLastSeenComment = (timeout = 200) => {
  const { activity } = props;
  const payload = {
    activityUid: activity.uid,
    lastCommentAt: lastCommentAt.value as number,
  };
  setTimeout(() => commentStore.markSeenComments(payload), timeout);
};

const remove = (id: number) =>
  commentStore.remove(props.activity.repositoryId, id);

const updateResolvement = (comment: Comment) =>
  commentStore.updateResolvement(props.activity.repositoryId, comment);

onBeforeMount(() => {
  const { id: activityId, repositoryId } = props.activity;
  commentStore.fetch(repositoryId, { activityId });
});
</script>
