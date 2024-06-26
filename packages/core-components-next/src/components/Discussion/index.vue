<template>
  <div ref="containerEl" class="embedded-discussion">
    <div v-if="showResolveButton" class="d-flex justify-center">
      <ResolveButton class="mb-2" @click.stop="resolveAll" />
    </div>
    <div :class="{ 'pb-7': !showHeading && hasHiddenComments }">
      <VBtn
        v-if="hasHiddenComments"
        class="float-right mt-1"
        color="teal-lighten-4"
        size="x-small"
        variant="tonal"
        @click="showAll = !showAll"
      >
        Show {{ showAll ? 'less' : 'more' }}
      </VBtn>
    </div>
    <div v-if="showHeading" class="discussion-heading text-primary-lighten-3">
      Comments
    </div>
    <VAlert
      v-if="!commentsCount && showNotifications"
      class="alert mt-1 mb-4"
      color="primary-lighten-2"
      icon="mdi-keyboard-outline"
      variant="tonal"
      prominent
    >
      <span class="px-1 text-primary-lighten-4 text-body-2">
        Be the First to Comment!
      </span>
    </VAlert>
    <DiscussionThread
      v-if="thread.length"
      :is-activity-thread="isActivityThread"
      :items="thread"
      :min-displayed="commentsShownLimit"
      :show-all="showAll"
      :unseen-count="unseenComments.length"
      :user="user"
      class="mt-2"
      @remove="remove"
      @resolve="emit('resolve', $event)"
      @seen="emit('seen')"
      @show-all="showAll = $event"
      @unresolve="emit('unresolve', $event)"
      @update="emit('update', $event)"
    />
    <div ref="inputContainerEl" class="text-right pt-2">
      <VTextarea
        ref="inputEl"
        v-model="contentInput"
        :errors="errors.message"
        :placeholder="
          commentsCount ? 'Add a comment...' : 'Start the discussion...'
        "
        class="comment-input"
        rows="3"
        variant="outlined"
        auto-grow
        clearable
        hide-details
        @focus="emit('seen')"
      />
      <VBtn
        :disabled="isTextEditorEmpty || error"
        aria-label="Post comment"
        class="mt-3"
        color="teal-lighten-5"
        icon="mdi-send"
        variant="text"
        @click="post"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, nextTick, ref, watch } from 'vue';
import { object, string } from 'yup';
import type { Comment } from 'tailor-interfaces/comment';
import orderBy from 'lodash/orderBy';
import { useForm } from 'vee-validate';
import type { User } from 'tailor-interfaces/user';

import DiscussionThread from './Thread/index.vue';
import ResolveButton from './ResolveButton.vue';

interface Props {
  user: User;
  comments?: Comment[];
  unseenComments?: Comment[];
  commentsShownLimit?: number;
  scrollTarget?: string;
  showHeading?: boolean;
  showNotifications?: boolean;
  isActivityThread?: boolean;
  hasUnresolvedComments?: boolean;
  isVisible?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  comments: () => [],
  unseenComments: () => [],
  commentsShownLimit: 5,
  scrollTarget: 'discussion',
  showHeading: false,
  showNotifications: false,
  isActivityThread: false,
  hasUnresolvedComments: false,
  isVisible: false,
});

const emit = defineEmits([
  'change',
  'save',
  'remove',
  'resolve',
  'seen',
  'unresolve',
  'update',
  'update:confirmationActive',
]);

const eventBus = inject<any>('$eventBus');
const showConfirmationModal = (opts: any) =>
  eventBus.channel('app').emit('showConfirmationModal', opts);

// Template refs
const containerEl = ref<HTMLElement>();
const inputContainerEl = ref<HTMLElement>();
const inputEl = ref<HTMLElement>();

const showAll = ref(false);
const error = ref(false);

const { defineField, errors, handleSubmit } = useForm({
  validationSchema: object({
    message: string().required().max(600, 'Max 600 characters'),
  }),
});
const [contentInput] = defineField('message');

const thread = computed(() => {
  const processedThread = props.comments.map((comment) => {
    const unseen = props.unseenComments.find((it) => it.id === comment.id);
    return { ...comment, unseen: !!unseen };
  });
  return orderBy(processedThread, ['unseen', 'createdAt'], 'asc');
});

const commentsCount = computed(() => thread.value.length);

const hasHiddenComments = computed(
  () => props.commentsShownLimit < commentsCount.value,
);

const isTextEditorEmpty = computed(() => !contentInput.value?.trim());

const showResolveButton = computed(
  () => props.hasUnresolvedComments && !props.isActivityThread,
);

const post = handleSubmit(() => {
  if (isTextEditorEmpty.value) return;
  const { scrollTarget, user: author } = props;
  const scrollTargetRef =
    scrollTarget === 'discussion' ? containerEl : inputContainerEl;
  const payload = {
    content: contentInput.value,
    author,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  emit('save', payload);
  contentInput.value = '';
  const scrollOptions: ScrollIntoViewOptions = {
    block: 'center',
    behavior: 'smooth',
  };
  nextTick(() => scrollTargetRef.value?.scrollIntoView(scrollOptions));
});

const remove = (comment: Comment) => {
  showConfirmationModal({
    title: 'Remove comment',
    message: 'Are you sure you want to remove this comment?',
    action: () => emit('remove', comment.id),
    ...onConfirmationActive(),
  });
};

const resolveAll = () => {
  showConfirmationModal({
    title: 'Resolve all comments',
    message: 'Are you sure you want to resolve all comments?',
    action: () => emit('resolve'),
    ...onConfirmationActive(),
  });
};

const onConfirmationActive = () => {
  const onOpen = () => emit('update:confirmationActive', true);
  const onClose = () => emit('update:confirmationActive', false);
  return { onOpen, onClose };
};

watch(commentsCount, () => emit('change', thread.value));

watch(
  () => props.isVisible,
  async (val) => {
    if (!val && props.isActivityThread) return;
    setTimeout(() => inputEl.value?.focus(), 500);
  },
  { immediate: true },
);
</script>

<style lang="scss" scoped>
.embedded-discussion {
  font-family: Roboto, Arial, sans-serif;

  .discussion-heading {
    padding: 0 0 0.5rem 0;
    font-size: 0.875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .resolve-btn-container {
    display: flex;
    justify-content: flex-end;
    margin: 0.5rem 0 0 0;
  }

  .header {
    margin: 0.75rem 0 1.25rem 0;
    font-size: 1.125rem;
    font-weight: 400;
  }

  .comment-input {
    margin: 0 0.25rem 0 0.25rem;
  }

  .alert :deep(.v-icon) {
    color: var(--v-primary-darken2) !important;
  }
}
</style>
