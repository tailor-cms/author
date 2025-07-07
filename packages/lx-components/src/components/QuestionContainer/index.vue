<template>
  <VCard
    class="question-container pa-4"
    color="grey-lighten-5"
    variant="flat"
    border
  >
    <VForm ref="form" class="tce-root" @submit.prevent="submit">
      <div class="d-flex align-center mb-4">
        <div class="text-subtitle-1 font-weight-bold">Question</div>
        <VSpacer />
        <div v-if="data.hint" class="d-flex justify-end text-subtitle-2">
          <QuestionHint :hint="data.hint" />
        </div>
      </div>
      <QuestionPrompt
        :embeds="data.embeds"
        :question="data.question"
        class="mb-4"
      />
      <slot></slot>
      <VDivider class="mt-8 mb-4 mx-n4" />
      <VFadeTransition>
        <QuestionFeedback
          v-if="isSubmitted"
          :feedback="feedback ?? data.feedback"
          :is-correct="isCorrect"
          :is-graded="isGraded"
          class="mt-4"
        />
      </VFadeTransition>
      <div v-if="!isSubmitted || allowedRetake" class="d-flex justify-end mt-4">
        <VBtn
          v-if="!isSubmitted"
          append-icon="mdi-send"
          color="primary-darken-1"
          type="submit"
          variant="flat"
        >
          Submit
        </VBtn>
        <VBtn
          v-else
          append-icon="mdi-refresh"
          variant="text"
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
  feedback: Record<string, any>;
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
