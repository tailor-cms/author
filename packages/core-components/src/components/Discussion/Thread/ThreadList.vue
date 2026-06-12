<template>
  <ul class="thread-list">
    <li v-for="(comment, index) in comments" :key="comment.uid" class="thread-list-item">
      <VDivider v-if="index !== 0" class="my-3" />
      <ThreadComment
        v-bind="{
          comment,
          isActivityThread,
          user,
          ...$attrs,
        }"
        :element-label="getElementLabel(comment)"
        class="pa-2"
      />
    </li>
  </ul>
</template>

<script lang="ts" setup>
import type { Comment } from '@tailor-cms/interfaces/comment';
import { inject } from 'vue';
import type { User } from '@tailor-cms/interfaces/user';

import ThreadComment from './Comment/index.vue';

interface Props {
  user: User;
  comments?: Comment[];
  isActivityThread?: boolean;
  elementLabel?: string;
}

withDefaults(defineProps<Props>(), {
  comments: () => [],
  isActivityThread: false,
  elementLabel: '',
});

const ceRegistry = inject<any>('$ceRegistry');

const getElementLabel = (comment: Comment) => {
  if (!comment.contentElement?.type) return;
  return ceRegistry?.get
    ? ceRegistry.get(comment.contentElement.type)?.name
    : '';
};
</script>

<style lang="scss" scoped>
.thread-list {
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
