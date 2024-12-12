<!-- eslint-disable vue/no-undef-components -->
<template>
  <VCard class="question-container my-2" elevation="0">
    <VForm ref="form" class="content text-left" validate-on="submit">
      <QuestionPrompt
        :element-data="elementData"
        :is-disabled="isDisabled"
        :allowed-types="allowedEmbedTypes"
        @update="emit('update', $event)"
      />
      <slot></slot>
      <QuestionHint
        :is-editing="!isDisabled"
        :hint="elementData.hint"
        @update="emit('update', { hint: $event })"
      />
      <QuestionFeedback
        v-if="showFeedback"
        :answers="elementData.answers"
        :feedback="elementData.feedback"
        :is-editing="!isDisabled"
        :is-gradable="elementData.isGradable"
        @update="emit('update', { feedback: $event })"
      />
      <div v-if="!isDisabled" class="d-flex justify-end">
        <VBtn
          :disabled="!isDirty"
          color="primary-darken-4"
          variant="text"
          @click="emit('cancel')"
        >
          Cancel
        </VBtn>
        <VBtn
          :disabled="!isDirty"
          class="ml-2"
          color="primary-darken-3"
          variant="tonal"
          @click="save"
        >
          Save
        </VBtn>
      </div>
    </VForm>
  </VCard>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

import QuestionFeedback from './QuestionFeedback.vue';
import QuestionHint from './QuestionHint.vue';
import QuestionPrompt from './QuestionPrompt.vue';

interface Props {
  allowedEmbedTypes: string[];
  elementData: Record<string, any>;
  isDisabled: boolean;
  isDirty: boolean;
  showFeedback?: boolean;
}

withDefaults(defineProps<Props>(), {
  showFeedback: true,
});
const emit = defineEmits(['cancel', 'delete', 'save', 'update']);

const form = ref();

const save = async () => {
  if (!form.value) return;
  const { valid } = await form.value.validate();
  if (valid) emit('save');
};
</script>

<style lang="scss" scoped>
:deep(.v-input__control) {
  flex-wrap: wrap;
}
</style>
