<template>
  <VMenu
    v-model="isVisible"
    :close-on-click="!isConfirmationActive"
    :close-on-content-click="false"
    location="left"
    min-width="450"
    transition="slide-y-transition"
    attach
    offset-y
  >
    <template #activator="{ props: menuProps }">
      <VTooltip location="left" open-delay="800">
        <template #activator="{ props: tooltipProps }">
          <VBtn
            v-bind="{ ...menuProps, ...tooltipProps }"
            :class="activator?.class"
            :icon="activator?.icon"
            size="x-small"
            variant="text"
          >
            <div v-if="activator.text" class="unseen">{{ activator.text }}</div>
            <VIcon v-else :color="activator.color" size="18">
              {{ activator.icon }}
            </VIcon>
          </VBtn>
        </template>
        <span>{{ activator.tooltip }}</span>
      </VTooltip>
    </template>
    <VSheet class="pa-3" color="primary-darken-4" elevation="5">
      <Discussion
        v-bind="{
          comments,
          unseenComments,
          hasUnresolvedComments,
          user,
          isVisible,
        }"
        v-model:confirmation-active="isConfirmationActive"
        class="pa-2"
        @remove="editorBus.emit(Events.Discussion.REMOVE, $event)"
        @resolve="resolve"
        @save="save"
        @seen="setLastSeen"
        @update="save"
      />
    </VSheet>
  </VMenu>
</template>

<script lang="ts" setup>
import { computed, defineProps, inject, ref } from 'vue';
import { Events } from '@tailor-cms/utils';
import get from 'lodash/get';

import Discussion from './Discussion/index.vue';

const getActivatorOptions = (unseenComments: any) => ({
  unseen: {
    class: 'teal accent-4 white--text',
    tooltip: 'View new comments',
    text: unseenComments.length,
  },
  preview: {
    icon: 'mdi-comment-text-multiple-outline',
    color: 'primary darken-4',
    tooltip: 'View comments',
  },
  post: {
    icon: 'mdi-message-plus-outline',
    color: 'primary darken-4',
    tooltip: 'Post a comment',
  },
});

const props = defineProps({
  id: { type: Number, default: null },
  uid: { type: String, required: true },
  activityId: { type: Number, required: true },
  repositoryId: { type: Number, required: true },
  comments: { type: Array, required: true },
  hasUnresolvedComments: { type: Boolean, default: false },
  lastSeen: { type: Number, required: true },
  user: { type: Object, required: true },
});

const isVisible = ref(false);
const isConfirmationActive = ref(false);

const editorBus = inject('$editorBus') as any;

const lastCommentAt = computed(() =>
  new Date(get(props.comments[0], 'createdAt', 0)).getTime(),
);

const unseenComments = computed(() => {
  return props.comments.filter((it: any) => {
    const createdAt = new Date(it.createdAt).getTime();
    return it.author.id !== props.user.id && createdAt > props.lastSeen;
  });
});

const activator = computed(() => {
  const type = unseenComments.value.length
    ? 'unseen'
    : props.comments.length
      ? 'preview'
      : 'post';
  return getActivatorOptions(unseenComments.value)[type] as any;
});

const save = (data: any) => {
  return editorBus.emit(Events.Discussion.SAVE, {
    ...data,
    author: props.user,
    activityId: props.activityId,
    repositoryId: props.repositoryId,
    contentElementId: props.id,
    hasUnresolvedComments: props.hasUnresolvedComments,
  });
};

const setLastSeen = (timeout: number) => {
  const options = {
    elementUid: props.uid,
    lastCommentAt: lastCommentAt.value,
    timeout,
  };
  editorBus.emit(Events.Discussion.SET_LAST_SEEN, options);
};

const resolve = ({ id, resolvedAt } = {}) => {
  editorBus.emit(Events.Discussion.RESOLVE, {
    id,
    contentElementId: props.id,
    resolvedAt,
  });
};
</script>

<style lang="scss" scoped>
::v-deep .v-menu__content {
  background: #fff;

  .embedded-discussion {
    text-align: left;
  }

  .comment .author {
    font-size: 0.875rem;
  }
}

.unseen {
  font-size: 0.75rem;
}
</style>
