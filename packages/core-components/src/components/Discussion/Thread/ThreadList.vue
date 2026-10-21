<template>
  <ul class="thread-list d-flex flex-column ga-1">
    <li v-for="comment in comments" :key="comment.uid" class="thread-list-item">
      <ThreadComment
        v-bind="{ comment, isActivityThread, user, ...$attrs }"
        :element-label="elementLabel(comment)"
      />
    </li>
  </ul>
</template>

<script lang="ts" setup>
import type { Comment } from '@tailor-cms/interfaces/comment';
import type { User } from '@tailor-cms/interfaces/user';

import { inject } from 'vue';
import ThreadComment from './Comment/index.vue';

defineOptions({ inheritAttrs: false });

interface Props {
  user: User;
  comments?: Comment[];
  isActivityThread?: boolean;
}

withDefaults(defineProps<Props>(), {
  comments: () => [],
  isActivityThread: false,
});

const ceRegistry = inject<any>('$ceRegistry');

// The element type's name ("Image") for a comment left on an element
const elementLabel = (comment: Comment): string | undefined => {
  const type = comment.contentElement?.type;
  return type ? ceRegistry?.get?.(type)?.name : undefined;
};
</script>

<style lang="scss" scoped>
.thread-list {
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
