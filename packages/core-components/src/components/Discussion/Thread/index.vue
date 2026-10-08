<template>
  <div
    v-intersect="onIntersect"
    :class="{ 'scroll-container': !isActivityThread }"
    class="discussion-thread"
  >
    <ThreadList
      v-bind="{
        isActivityThread,
        user,
        comments: visibleComments.seen,
      }"
      @react="(comment: Comment, emoji: string) =>
        emit('react', comment, emoji)"
      @remove="emit('remove', $event)"
      @resolve="emit('resolve', $event)"
      @unresolve="emit('unresolve', $event)"
      @update="onUpdate"
    />
    <UnseenDivider
      v-if="unseenCount"
      ref="unseenDividerEl"
      :count="unseenCount"
      @seen="markSeen"
    />
    <ThreadList
      v-bind="{
        isActivityThread,
        user,
        comments: visibleComments.unseen,
      }"
      @react="(comment: Comment, emoji: string) =>
        emit('react', comment, emoji)"
      @remove="emit('remove', $event)"
      @resolve="emit('resolve', $event)"
      @unresolve="emit('unresolve', $event)"
      @update="onUpdate"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue';
import type { Comment } from '@tailor-cms/interfaces/comment';
import { partition, takeRight } from 'lodash-es';
import type { User } from '@tailor-cms/interfaces/user';

import ThreadList from './ThreadList.vue';
import UnseenDivider from './UnseenDivider.vue';

interface Props {
  items: Comment[];
  unseenCount: number;
  user: User;
  minDisplayed?: number;
  isActivityThread?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  minDisplayed: 5,
  isActivityThread: false,
});

const emit = defineEmits([
  'react',
  'remove',
  'resolve',
  'unresolve',
  'update',
  'seen',
]);

const unseenDividerEl = ref();
const isVisible = ref(false);

const visibleComments = computed(() => {
  const comments = props.showAll
    ? props.items
    : takeRight(props.items, props.minDisplayed);
  const [unseen, seen] = partition(comments, 'unseen');
  return { seen, unseen };
});

const onUpdate = (comment: Comment, content: string) => {
  emit('update', { ...comment, content });
};

const onIntersect = (val: boolean) => (isVisible.value = val);

const revealUnseen = (count = null) => {
  if ((count || props.unseenCount) < props.minDisplayed) return;
  emit('showAll', true);
  nextTick(() => {
    const element = unseenDividerEl.value?.$el;
    if (!element) return;
    element.scrollIntoView({ behavior: 'smooth' });
  });
};

const markSeen = () => {
  emit('seen');
  showAll.value = false;
};

watch(isVisible, (val) => {
  if (!val || !props.unseenCount) return;
  revealUnseen();
});

watch(() => props.unseenCount, revealUnseen, { immediate: true });
</script>

<style lang="scss" scoped>
.discussion-thread {
  width: 100%;

  &.scroll-container {
    max-height: 31.25rem;
    box-sizing: content-box;
    overflow-y: scroll;
    overflow-x: hidden;
    -ms-overflow-style: none;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }
}
</style>
