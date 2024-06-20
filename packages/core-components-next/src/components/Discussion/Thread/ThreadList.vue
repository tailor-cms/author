<template>
  <ul class="thread-list">
    <li v-for="comment in comments" :key="comment.uid" class="thread-list-item">
      <VDivider />
      <ThreadComment
        v-bind="{
          comment,
          isActivityThread,
          user,
          ...$attrs,
        }"
        :element-label="getElementLabel(comment)"
        class="mb-3"
      />
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { inject } from 'vue';

import ThreadComment from './Comment/index.vue';

defineProps({
  comments: { type: Array, default: () => [] },
  isActivityThread: { type: Boolean, default: false },
  elementLabel: { type: String, default: null },
  user: { type: Object, required: true },
});

const ceRegistry = inject('$ceRegistry') as any;

const getElementLabel = (comment: any) => {
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

  .thread-list-item {
    .v-divider {
      margin: 0 0.25rem 1rem 0.25rem;
      color: #fafafa;
      opacity: 0.3;
    }

    &:first-child .v-divider {
      display: none;
    }
  }
}
</style>
