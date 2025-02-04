<template>
  <VCard class="question-container pa-4">
    <VForm ref="form" class="tce-root" @submit.prevent="submit">
      <QuestionPrompt :embeds="data.embeds" class="mb-4" />
      <div v-if="data.hint" class="d-flex justify-end text-subtitle-2">
        <QuestionHint :hint="data.hint" />
      </div>
      <slot></slot>
      <VDivider class="my-4 mx-n4" />
      <QuestionFeedback
        v-if="isSubmitted"
        :feedback="data.feedback"
        :is-correct="isCorrect"
        :is-graded="isGraded"
      />
      <div v-if="!isSubmitted || allowedRetake" class="d-flex justify-end">
        <VBtn
          v-if="!isSubmitted"
          color="primary"
          prepend-icon="mdi-check"
          type="submit"
          variant="tonal"
        >
          Submit
        </VBtn>
        <VBtn
          v-else
          prepend-icon="mdi-refresh"
          variant="tonal"
          @click="emit('retry')"
        >
          Retry
        </VBtn>
      </div>
    </VForm>
  </VCard>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import QuestionFeedback from './QuestionFeedback.vue';
import QuestionHint from './QuestionHint.vue';
import QuestionPrompt from './QuestionPrompt.vue';

interface Props {
  data: Record<string, any>;
  isCorrect: boolean;
  isGraded: boolean;
  isSubmitted: boolean;
  allowedRetake?: boolean;
}

withDefaults(defineProps<Props>(), { allowedRetake: false });
const emit = defineEmits(['submit', 'retry']);

const form = ref<HTMLFormElement>();

const submit = async () => {
  if (!form.value) return;
  const { valid } = await form.value.validate();
  if (valid) emit('submit');
};
</script>

<style lang="scss" scoped>
.tce-root {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 1rem;
}
</style>
