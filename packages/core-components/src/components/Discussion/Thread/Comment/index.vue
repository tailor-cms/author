<template>
  <div :class="{ 'opacity-60': isDeleted }" class="comment ma-2">
    <UserAvatar
      v-if="comment.author"
      :img-url="comment.author.imgUrl"
      :size="34"
    />
    <div class="comment-main">
      <CommentHeader
        v-bind="{
          comment,
          isActivityThread,
          isEditing,
          isResolved,
          elementLabel,
          user,
        }"
        @remove="remove"
        @resolve="handleResolvementUpdate"
        @enable-edit="isEditing = true"
      />
      <div class="comment-body">
        <CommentPreview
          v-if="!isEditing"
          v-bind="{ content: comment.content, isResolved, isDeleted, isEdited }"
          @unresolve="handleResolvementUpdate"
        />
        <template v-else>
          <!-- eslint-disable vuejs-accessibility/no-autofocus -->
          <VTextarea
            v-model.trim="contentInput"
            :error-messages="errors.message"
            class="comment-editor"
            rows="3"
            variant="outlined"
            hide-details="auto"
            auto-grow
            autofocus
            clearable
          />
          <!-- eslint-enable vuejs-accessibility/no-autofocus -->
          <span class="d-flex justify-end mt-3 ga-2">
            <VBtn size="small" text="Cancel" variant="text" @click="reset" />
            <VBtn
              prepend-icon="mdi-check"
              size="small"
              text="Save"
              variant="tonal"
              @click="save"
            />
          </span>
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import type { Comment } from '@tailor-cms/interfaces/comment';
import type { User } from '@tailor-cms/interfaces/user';

import CommentHeader from './CommentHeader.vue';
import CommentPreview from './CommentPreview.vue';
import UserAvatar from '../../../UserAvatar.vue';
import { object, string } from 'yup';
import { useForm } from 'vee-validate';

interface Props {
  user: User;
  comment: Comment;
  isActivityThread?: boolean;
  elementLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  isActivityThread: false,
  elementLabel: '',
});

const emit = defineEmits(['remove', 'resolve', 'unresolve', 'update']);

const isEditing = ref(false);
const isResolved = computed(() => !!props.comment.resolvedAt);
const isDeleted = computed(() => !!props.comment.deletedAt);
const isEdited = computed(() => !!props.comment.editedAt);

const { defineField, errors, handleSubmit, resetForm } = useForm({
  validationSchema: object({
    message: string().max(600, 'Max 600 characters'),
  }),
  initialValues: {
    message: props.comment.content,
  },
});
const [contentInput] = defineField('message');

const save = handleSubmit(() => {
  if (!contentInput.value) return remove();
  isEditing.value = false;
  emit('update', props.comment, contentInput.value);
});

const remove = () => {
  emit('remove', props.comment);
};

const handleResolvementUpdate = () => {
  emit(isResolved.value ? 'unresolve' : 'resolve', props.comment);
};

const reset = () => {
  resetForm();
  isEditing.value = false;
};

watch(() => props.comment, reset, { deep: true });
</script>

<style lang="scss" scoped>
.comment {
  display: flex;
  gap: 0.75rem;
  transition: background-color 0.2s ease-in-out;

  &-main {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
  }

  &-editor.v-textarea {
    margin: 0.75rem 0 0 0;
  }
}
</style>
