<!-- eslint-disable vue/no-undef-components -->
<template>
  <VCard class="question-container" elevation="0" border>
    <VToolbar class="px-4" color="primary-darken-3" height="36">
      <VIcon :icon="icon" color="secondary-lighten-2" size="18" start />
      <span class="text-subtitle-2">{{ name }}</span>
    </VToolbar>
    <VForm ref="form" class="content" validate-on="submit">
      <VSheet class="pa-4" color="primary-lighten-5">
        <QuestionPrompt
          :element-data="elementData"
          :is-disabled="isDisabled"
          @update="emit('update', $event)"
        />
      </VSheet>
      <VDivider />
      <VCardText>
        <slot></slot>
        <QuestionHint
          :hint="elementData.hint"
          @update="emit('update', { hint: $event })"
        />
        <QuestionFeedback
          v-if="showFeedback"
          :answers="elementData.answers"
          :feedback="elementData.feedback"
          :is-editing="!isDisabled"
          :is-graded="isGraded"
          @update="emit('update', { feedback: $event })"
        />
      </VCardText>
      <VCardActions class="d-flex justify-end pa-4 pt-0">
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
      </VCardActions>
    </VForm>
  </VCard>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

import QuestionFeedback from './QuestionFeedback.vue';
import QuestionHint from './QuestionHint.vue';
import QuestionPrompt from './QuestionPrompt.vue';

defineProps<{
  elementData: Record<string, any>;
  name: string;
  icon: string;
  showFeedback: boolean;
  isDisabled: boolean;
  isDirty: boolean;
  isGraded: boolean;
}>();
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
