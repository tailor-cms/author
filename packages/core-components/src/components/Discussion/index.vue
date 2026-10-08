<template>
  <div ref="containerEl" class="embedded-discussion">
    <div v-if="showResolveButton" class="d-flex justify-center">
      <ResolveButton class="mb-2" @click.stop="resolveAll" />
    </div>
    <div :class="{ 'pb-7 mb-2': !showHeading && hasHiddenComments }">
      <VBtn
        v-if="hasHiddenComments"
        :text="showAll ? 'Show less' : 'Show more'"
        class="float-right"
        rounded="lg"
        size="small"
        variant="text"
        width="84"
        @click="showAll = !showAll"
      />
    </div>
    <div
      v-if="showHeading"
      class="text-uppercase text-label-medium font-weight-bold mb-4"
    >
      Comments
    </div>
    <VAlert
      v-if="!commentsCount && showNotifications"
      class="alert mb-4"
      icon="mdi-keyboard-outline"
      text="Be the First to Comment!"
      variant="tonal"
    />
    <DiscussionThread
      v-if="thread.length"
      :is-activity-thread="isActivityThread"
      :items="thread"
      :min-displayed="commentsShownLimit"
      :show-all="showAll"
      :unseen-count="unseenComments.length"
      :user="user"
      @remove="remove"
      @resolve="emit('resolve', $event)"
      @seen="emit('seen')"
      @show-all="showAll = $event"
      @unresolve="emit('unresolve', $event)"
      @update="emit('update', $event)"
    />
    <div ref="inputContainerEl" class="text-right mt-4">
      <VTextarea
        ref="inputEl"
        v-model="contentInput"
        :error-messages="errors.message"
        :placeholder="
          commentsCount ? 'Add a comment...' : 'Start the discussion...'
        "
        class="comment-input"
        hide-details="auto"
        rows="3"
        variant="outlined"
        auto-grow
        clearable
        @focus="emit('seen')"
      />
      <VBtn
        :disabled="isTextEditorEmpty || error"
        aria-label="Post comment"
        class="mt-3"
        icon="mdi-send"
        variant="text"
        @click="post"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Comment } from '@tailor-cms/interfaces/comment';
import type { User } from '@tailor-cms/interfaces/user';
import { computed, nextTick, ref, watch } from 'vue';
import { lastOwnMessage } from './messages';
import { orderBy } from 'lodash-es';
import { provideEditingMessage } from './context';
import { useConfirmationDialog } from '../../composables/useConfirmationDialog';
import DiscussionThread from './Thread/index.vue';
import MessageComposer from './MessageComposer/index.vue';

interface Props {
  user: User;
  comments?: Comment[];
  unseenComments?: Comment[];
  commentsShownLimit?: number;
  scrollTarget?: string;
  showHeading?: boolean;
  showNotifications?: boolean;
  isActivityThread?: boolean;
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
  isVisible: false,
});

const emit = defineEmits([
  'save',
  'react',
  'remove',
  'resolve',
  'seen',
  'unresolve',
  'update',
  'update:confirmationActive',
]);

const showConfirmationDialog = useConfirmationDialog();

// Template refs
const containerEl = ref<HTMLElement>();
const inputContainerEl = ref<HTMLElement>();
const inputEl = ref<HTMLElement>();

const showAll = ref(false);
const error = ref(false);

const { defineField, errors, handleSubmit, resetForm } = useForm({
  validationSchema: object({
    message: string().max(600, 'Max 600 characters'),
  }),
});
const [contentInput] = defineField('message', { validateOnModelUpdate: true });

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

const hasUnresolvedComments = computed(() =>
  props.comments.some((it) => !it.resolvedAt && !it.deletedAt),
);

const showResolveButton = computed(
  () => hasUnresolvedComments.value && !props.isActivityThread,
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
  resetForm();
  const scrollOptions: ScrollIntoViewOptions = {
    block: 'center',
    behavior: 'smooth',
  };
  nextTick(() => scrollTargetRef.value?.scrollIntoView(scrollOptions));
});

const remove = (comment: Comment) => {
  showConfirmationDialog({
    title: 'Remove comment',
    message: 'Are you sure you want to remove this comment?',
    color: 'error',
    action: () => emit('remove', comment.id),
    ...onConfirmationActive(),
  });
};

const resolveAll = () => {
  showConfirmationDialog({
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

watch(
  () => props.isVisible,
  async (val) => {
    if (!val && props.isActivityThread) return;
    setTimeout(() => {
      // Skip if focus is already within the discussion (e.g., editing a comment)
      if (containerEl.value?.contains(document.activeElement)) return;
      inputEl.value?.focus();
    }, 500);
  },
  { immediate: true },
);
</script>
