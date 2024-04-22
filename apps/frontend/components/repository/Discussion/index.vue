<template>
  <VSheet v-bind="sheetStyles" class="activity-discussion py-2 px-4">
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
import { computed, defineProps } from 'vue';
import { Discussion as ActivityDiscussion } from '@tailor-cms/core-components-next';
import get from 'lodash/get';
import orderBy from 'lodash/orderBy';

import { useAuthStore } from '@/stores/auth';
import { useCommentStore } from '@/stores/comments';

const props = defineProps({
  activity: { type: Object, required: true },
  panel: { type: Boolean, default: false },
  showHeading: { type: Boolean, default: false },
});

const { $ceRegistry } = useNuxtApp() as any;
provide('$ceRegistry', $ceRegistry);

const authStore = useAuthStore();
const commentStore = useCommentStore();

const user = computed(() => authStore.user);

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
  props.panel
    ? { color: 'primary-darken-3', elevation: 1 }
    : { color: 'transparent', elevation: 0 },
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

const updateResolvement = (data: any) =>
  commentStore.updateResolvement(props.activity.repositoryId, data);

onBeforeMount(() => {
  const { id: activityId, repositoryId } = props.activity;
  commentStore.fetch(repositoryId, { activityId });
});
</script>
