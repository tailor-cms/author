<template>
  <div class="text-left">
    <QuestionPrompt
      :allowed-element-config="embedElementConfig"
      :element-data="elementData"
      :is-readonly="isReadonly"
      @update="$emit('update', $event)"
    />
    <slot></slot>
    <QuestionHint
      :hint="elementData.hint"
      :is-readonly="isReadonly"
      @update="$emit('update', { hint: $event })"
    />
    <QuestionFeedback
      :answers="elementData.answers"
      :feedback="elementData.feedback"
      :is-readonly="isReadonly"
      :is-gradable="elementData.isGradable"
      :show-answer-feedback="showAnswerFeedback"
      @update="$emit('update', { feedback: $event })"
    />
  </div>
</template>

<script lang="ts" setup>
import type { ContentElementCategory } from '@tailor-cms/interfaces/schema';

import QuestionFeedback from './QuestionFeedback.vue';
import QuestionHint from './QuestionHint.vue';
import QuestionPrompt from './QuestionPrompt.vue';

interface Props {
  elementData: Record<string, any>;
  isReadonly?: boolean;
  showAnswerFeedback?: boolean;
  embedElementConfig?: ContentElementCategory[];
}

withDefaults(defineProps<Props>(), {
  embedElementConfig: () => [],
  isDirty: false,
  isReadonly: false,
  showAnswerFeedback: false,
});
defineEmits(['update']);
</script>

<style lang="scss" scoped>
:deep(.v-input__control) {
  flex-wrap: wrap;
}
</style>
