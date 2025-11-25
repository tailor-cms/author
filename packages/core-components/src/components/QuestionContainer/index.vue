<template>
  <div class="text-left">
    <QuestionPrompt
      :allowed-element-config="embedElementConfig"
      :element-data="elementData"
      :is-readonly="isReadonly || isDisabled"
      @update="$emit('update', $event)"
    />
    <slot></slot>
    <QuestionHint
      :hint="elementData.hint"
      :is-readonly="isReadonly || isDisabled"
      @update="$emit('update', { hint: $event })"
    />
    <QuestionFeedback
      v-if="showFeedback"
      :answers="elementData.answers"
      :feedback="elementData.feedback"
      :is-readonly="isReadonly || isDisabled"
      :is-gradable="elementData.isGradable"
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
  isDisabled?: boolean;
  isReadonly?: boolean;
  showFeedback?: boolean;
  embedElementConfig?: ContentElementCategory[];
}

withDefaults(defineProps<Props>(), {
  embedElementConfig: () => [],
  isDisabled: false,
  isDirty: false,
  isReadonly: false,
  showFeedback: true,
});
defineEmits(['update']);
</script>

<style lang="scss" scoped>
:deep(.v-input__control) {
  flex-wrap: wrap;
}
</style>
