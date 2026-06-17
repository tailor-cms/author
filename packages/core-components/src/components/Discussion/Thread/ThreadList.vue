<template>
  <ul class="thread-list d-flex flex-column ga-1">
    <li v-for="comment in comments" :key="comment.uid" class="thread-list-item">
      <ThreadComment
        v-bind="{
          comment,
          isActivityThread,
          user,
          ...$attrs,
        }"
        :element-label="getElementLabel(comment)"
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
