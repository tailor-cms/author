<!-- eslint-disable vue/no-undef-components -->
<template>
  <VCard class="question-container my-2" color="grey-lighten-5">
    <VToolbar class="px-4" color="primary-darken-3" height="36">
      <VIcon :icon="icon" color="secondary-lighten-2" size="18" start />
      <span class="text-subtitle-2">{{ type }}</span>
    </VToolbar>
    <VForm ref="form" class="content text-left pa-6" validate-on="submit">
      <QuestionPrompt
        :element-data="elementData"
        :is-disabled="isDisabled"
        :allowed-types="embedTypes"
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
      <VFadeTransition>
        <div v-if="!isDisabled && isDirty" class="d-flex justify-end">
          <VBtn
            color="primary-darken-4"
            variant="text"
            @click="emit('cancel')"
          >
            Cancel
          </VBtn>
          <VBtn
            class="ml-2"
            color="success"
            prepend-icon="mdi-check"
            variant="tonal"
            @click="save"
          >
            Save
          </VBtn>
        </div>
      </VFadeTransition>
    </VForm>
  </VCard>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

import type { ContentElementCategory } from '@tailor-cms/interfaces/schema';
import QuestionFeedback from './QuestionFeedback.vue';
import QuestionHint from './QuestionHint.vue';
import QuestionPrompt from './QuestionPrompt.vue';

interface Props {
  elementData: Record<string, any>;
  embedTypes: ContentElementCategory[];
  isDisabled?: boolean;
  isDirty?: boolean;
  type?: string;
  icon?: string;
  showFeedback?: boolean;
}

withDefaults(defineProps<Props>(), {
  type: 'Question element',
  icon: 'mdi-help-cirlce-outline',
  isDisabled: false,
  isDirty: false,
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
