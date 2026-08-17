<template>
  <div class="feedback-container">
    <VBtn
      :append-icon="isExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
      :aria-controls="contentId"
      :aria-expanded="isExpanded"
      class="mb-2"
      text="Feedback"
      variant="tonal"
      color="secondary"
      size="small"
      rounded="lg"
      @click="isExpanded = !isExpanded"
    />
    <VExpandTransition>
      <div
        v-show="isExpanded"
        :id="contentId"
        class="d-flex flex-column ga-6 pt-2"
      >
        <div>
          <RichTextEditor
            v-if="!isReadonly"
            :model-value="feedback?.general"
            label="General feedback"
            variant="outlined"
            hide-details
            toolbar-on-focus
            @update:model-value="update($event, 'general')"
          />
          <template v-else>
            <div class="text-label-medium text-medium-emphasis mb-1">
              General feedback
            </div>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div v-if="feedback?.general" v-html="feedback.general"></div>
            <div v-else class="text-medium-emphasis font-italic">
              Feedback not added.
            </div>
          </template>
        </div>
        <template v-if="showAnswerFeedback">
          <div v-for="(answer, index) in processedAnswers" :key="index">
            <RichTextEditor
              v-if="!isReadonly"
              :label="answerLabel(answer, index)"
              :model-value="feedback?.[index]"
              variant="outlined"
              hide-details
              toolbar-on-focus
              @update:model-value="update($event, index)"
            />
            <template v-else>
              <div
                class="text-label-medium text-medium-emphasis text-truncate mb-1"
              >
                {{ answerLabel(answer, index) }}
              </div>
              <!-- eslint-disable-next-line vue/no-v-html -->
              <div v-if="feedback?.[index]" v-html="feedback[index]"></div>
              <div v-else class="text-medium-emphasis font-italic">
                Feedback not added.
              </div>
            </template>
          </div>
        </template>
      </div>
    </VExpandTransition>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, useId, watch } from 'vue';
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

const contentId = useId();
const isExpanded = ref(some(props.feedback));
const answerType = computed(() => (props.isGradable ? 'Answer' : 'Option'));
const processedAnswers = computed(() =>
  isArray(props.answers) && props.answers.length
    ? props.answers
    : ['True', 'False'],
);

const answerLabel = (answer: string, index: number) => {
  const prefix = `${answerType.value} ${index + 1}`;
  return answer ? `${prefix} · ${answer}` : `${prefix} (answer not added)`;
};

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
