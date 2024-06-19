<template>
  <VSheet class="comment header pa-2 bg-transparent" rounded="xl">
    <CommentHeader
      v-bind="{
        comment,
        isActivityThread,
        isResolved,
        elementLabel,
        user,
      }"
      @remove="remove"
      @resolve="handleResolvementUpdate"
      @toggle-edit="toggleEdit"
    />
    <div class="comment-body">
      <CommentPreview
        v-if="!isEditing"
        v-bind="{ content, isResolved }"
        @unresolve="handleResolvementUpdate"
      />
      <template v-else>
        <!-- eslint-disable vuejs-accessibility/no-autofocus -->
        <VTextarea
          v-model.trim="content"
          class="comment-editor"
          rows="3"
          variant="outlined"
          auto-grow
          autofocus
          clearable
        />
        <!-- eslint-enable vuejs-accessibility/no-autofocus -->
        <span class="d-flex justify-end mt-2">
          <VBtn
            class="mr-2"
            color="grey-lighten-2"
            size="small"
            variant="tonal"
            @click="reset"
          >
            Cancel
          </VBtn>
          <VBtn
            color="teal-lighten-4"
            size="small"
            variant="tonal"
            @click="save"
          >
            <VIcon class="pr-1">mdi-check</VIcon>Save
          </VBtn>
        </span>
      </template>
    </div>
  </VSheet>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import CommentHeader from './CommentHeader.vue';
import CommentPreview from './CommentPreview.vue';

const props = defineProps({
  comment: { type: Object, required: true },
  isActivityThread: { type: Boolean, default: false },
  elementLabel: { type: String, default: null },
  user: { type: Object, required: true },
});

const emit = defineEmits(['remove', 'resolve', 'unresolve', 'update']);

const content = ref(props.comment.content);
const isEditing = ref(false);
const isResolved = computed(() => !!props.comment.resolvedAt);

const toggleEdit = () => {
  isEditing.value = !isEditing.value;
};

const save = () => {
  if (!content.value) return remove();
  toggleEdit();
  emit('update', props.comment, content.value);
};

const remove = () => {
  emit('remove', props.comment);
};

const handleResolvementUpdate = () => {
  emit(isResolved.value ? 'unresolve' : 'resolve', props.comment);
};

const reset = () => {
  content.value = props.comment.content;
  isEditing.value = false;
};

watch(() => props.comment, reset, { deep: true });
</script>

<style lang="scss" scoped>
.comment {
  display: flex;
  flex-direction: column;
  font-family: Roboto, Arial, sans-serif;

  &-body {
    flex: 1;
    padding: 0 0.25rem 0 3.25rem;
  }

  &-editor.v-textarea {
    margin: 0.75rem 0 0 0;

    :deep(.v-input__slot) {
      width: auto;
    }
  }
}
</style>
