<template>
  <div class="feedback-container">
    <div class="mb-2">
      <span class="text-title-small">Feedback</span>
      <VBtn
        :text="buttonLabel"
        class="ml-2"
        size="small"
        variant="text"
        @click="isExpanded = !isExpanded"
      />
    </div>
    <VExpandTransition>
      <div v-show="isExpanded">
        <div class="general-feedback text-title-small mb-6">
          <div class="mb-4">General feedback</div>
          <RichTextEditor
            v-if="!props.isReadonly"
            :model-value="feedback?.general"
            variant="outlined"
            hide-details
            @update:model-value="update($event, 'general')"
          />
          <template v-else>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div v-if="feedback?.general" v-html="feedback.general"></div>
            <span v-else class="font-italic">Feedback not added.</span>
          </template>
        </div>
        <template v-if="showAnswerFeedback">
          <div
            v-for="(answer, index) in processedAnswers"
            :key="index"
            class="text-title-small mb-6"
          >
            <div class="mb-4">
              {{ answerType }} {{ index + 1 }}:
              {{ answer || 'Answer not added.' }}
            </div>
            <RichTextEditor
              v-if="!props.isReadonly"
              :model-value="feedback?.[index]"
              variant="outlined"
              hide-details
              @update:model-value="update($event, index)"
            />
            <template v-else>
              <!-- eslint-disable-next-line vue/no-v-html -->
              <div v-if="feedback?.[index]" v-html="feedback[index]"></div>
              <span v-else class="font-italic">Feedback not added.</span>
            </template>
          </div>
        </template>
      </div>
    </VExpandTransition>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { isArray, some } from 'lodash-es';

import RichTextEditor from '../../RichTextEditor/index.vue';

interface Props {
  answers?: string[];
  isReadonly: boolean;
  isGradable: boolean;
  showAnswerFeedback?: boolean;
  // Numeric keys hold per-answer feedback, indexed by answer position. The
  // reserved 'general' key holds feedback shown regardless of the answer.
  feedback?: Record<number, string> & { general?: string };
}

const props = withDefaults(defineProps<Props>(), {
  answers: () => [],
  feedback: () => ({}),
  showAnswerFeedback: false,
});
const emit = defineEmits(['update']);

const isExpanded = ref(some(props.feedback));
const answerType = computed(() => (props.isGradable ? 'Answer' : 'Option'));
const buttonLabel = computed(() => (isExpanded.value ? 'hide' : 'show'));
const processedAnswers = computed(() =>
  isArray(props.answers) && props.answers.length
    ? props.answers
    : ['True', 'False'],
);

const update = (value: string, key: number | 'general') => {
  emit('update', { ...props.feedback, [key]: value });
};

watch(
  () => props.isReadonly,
  (val) => {
    if (!some(props.feedback)) return;
    if (!val) isExpanded.value = true;
  },
);
</script>
