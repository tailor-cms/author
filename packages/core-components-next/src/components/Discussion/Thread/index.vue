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
      @remove="emit('remove', $event)"
      @resolve="emit('resolve', $event)"
      @unresolve="emit('unresolve', $event)"
      @update="onUpdate"
    />
    <transition name="fade">
      <UnseenDivider
        v-if="unseenCount"
        ref="unseenDividerEl"
        :count="unseenCount"
        @seen="markSeen"
      />
    </transition>
    <ThreadList
      v-bind="{
        isActivityThread,
        user,
        comments: visibleComments.unseen,
      }"
      @remove="emit('remove', $event)"
      @resolve="emit('resolve', $event)"
      @unresolve="emit('unresolve', $event)"
      @update="onUpdate"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue';
import partition from 'lodash/partition';
import takeRight from 'lodash/takeRight';

import ThreadList from './ThreadList.vue';
import UnseenDivider from './UnseenDivider.vue';

interface Props {
  items: any[];
  unseenCount: number;
  user: any;
  showAll?: boolean;
  minDisplayed?: number;
  isActivityThread?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showAll: false,
  minDisplayed: 5,
  isActivityThread: false,
});

const emit = defineEmits([
  'remove',
  'resolve',
  'unresolve',
  'update',
  'showAll',
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

const onUpdate = (comment: any, content: any) => {
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
  emit('showAll', false);
};

watch(isVisible, (val) => {
  if (!val || !props.unseenCount) return;
  revealUnseen();
});

watch(
  () => props.unseenCount,
  () => revealUnseen(),
  { immediate: true },
);
</script>

<style lang="scss" scoped>
.discussion-thread {
  width: 100%;

  &.scroll-container {
    max-height: 31.25rem;
    box-sizing: content-box;
    overflow-y: scroll;
    overflow-x: hidden;
    -ms-overflow-style: none !important;
    scrollbar-width: none !important;

    &::-webkit-scrollbar {
      display: none !important;
    }
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.5s;
  }

  .fade-enter,
  .fade-leave-to {
    opacity: 0;
  }
}
</style>
