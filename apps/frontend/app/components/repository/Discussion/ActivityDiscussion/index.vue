<template>
  <VSheet color="transparent" class="activity-discussion">
    <LinkedCopyNotice
      v-if="activity.isLinkedCopy"
      :repository-id="activity.repositoryId"
      :activity-id="activity.id"
    />
    <Discussion
      v-else
      v-bind="{ comments, unseenComments, showHeading, user }"
      scroll-target="inputContainer"
      is-activity-thread
      show-notifications
      @react="react"
      @remove="remove"
      @save="saveComment"
      @seen="markSeen"
      @unresolve="updateResolvement"
      @update="saveComment"
    />
  </VSheet>
</template>

<script lang="ts" setup>
import type { User } from '@tailor-cms/interfaces/user';

import { get, orderBy } from 'lodash-es';
import { Discussion } from '@tailor-cms/core-components';

import LinkedCopyNotice from './LinkedCopyNotice.vue';
import { useAuthStore } from '@/stores/auth';
import { useCommentStore } from '@/stores/comments';

interface Props {
  activity: StoreActivity;
  showHeading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showHeading: false,
});

const { $ceRegistry } = useNuxtApp() as any;
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

const saveComment = (comment: any) => {
  const { activity } = props;
  return commentStore.save({
    ...comment,
    author: user.value,
    repositoryId: activity.repositoryId,
    activityId: activity.id,
  });
};

const SEEN_DELAY_MS = 200;

const markSeen = () => {
  const { activity } = props;
  const payload = {
    activityUid: activity.uid,
    lastCommentAt: lastCommentAt.value,
  };
  setTimeout(() => commentStore.markSeenComments(payload), SEEN_DELAY_MS);
};

const react = (comment: { id: number }, emoji: string) =>
  commentStore.toggleReaction(props.activity.repositoryId, comment.id, emoji);

const remove = (id: number) =>
  commentStore.remove(props.activity.repositoryId, id);

const updateResolvement = (data: any) =>
  commentStore.updateResolvement(props.activity.repositoryId, data);

onBeforeMount(() => {
  if (props.activity.isLinkedCopy) return;
  const { id: activityId, repositoryId } = props.activity;
  commentStore.fetch(repositoryId, { activityId });
});
</script>
