<!-- eslint-disable vue/no-undef-components -->
<template>
  <div class="text-left">
    <QuestionPrompt
      :element-data="elementData"
      :is-disabled="isDisabled"
      :allowed-element-config="embedElementConfig"
      @update="$emit('update', $event)"
    />
    <slot></slot>
    <QuestionHint
      :is-editing="!isDisabled"
      :hint="elementData.hint"
      @update="$emit('update', { hint: $event })"
    />
    <QuestionFeedback
      v-if="showFeedback"
      :answers="elementData.answers"
      :feedback="elementData.feedback"
      :is-editing="!isDisabled"
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
  embedElementConfig?: ContentElementCategory[];
  isDisabled?: boolean;
  showFeedback?: boolean;
}

withDefaults(defineProps<Props>(), {
  embedElementConfig: () => [],
  type: 'Question element',
  icon: 'mdi-help-cirlce-outline',
  isDisabled: false,
  isDirty: false,
  showFeedback: true,
});
defineEmits(['update']);
</script>

<style lang="scss" scoped>
:deep(.v-input__control) {
  flex-wrap: wrap;
}
</style>
