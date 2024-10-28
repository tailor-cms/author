<template>
  <div class="feedback-container">
    <div class="mb-2">
      <span class="text-subtitle-2">Feedback</span>
      <VBtn
        class="ml-2"
        color="primary-darken-4"
        size="small"
        variant="text"
        @click="toggleExpand"
      >
        {{ buttonLabel }}
      </VBtn>
    </div>
    <VFadeTransition>
      <div v-if="isExpanded">
        <div
          v-for="(answer, index) in processedAnswers"
          :key="index"
          class="mb-4"
        >
          <div class="mb-4">
            <span class="text-subtitle-2">
              {{ answerType }} {{ index + 1 }}:
              {{ answer || 'Answer not added.' }}
            </span>
          </div>
          <RichTextEditor
            v-if="props.isEditing"
            :model-value="feedback[index]"
            label="Feedback"
            variant="outlined"
            @update:model-value="emit('update', { [index]: $event })"
          />
          <div v-else>
            <div v-if="feedback[index]">{{ feedback[index] }}</div>
            <span v-else class="font-italic">Feedback not added.</span>
          </div>
        </div>
      </div>
    </VFadeTransition>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { isArray, some } from 'lodash';

import { RichTextEditor } from '..';

const props = defineProps<{
  answers: Array<string> | boolean | null;
  feedback: Record<string, string>;
  isEditing: boolean;
  isGraded: boolean;
}>();
const emit = defineEmits(['update']);

const isExpanded = ref(some(props.feedback));
const answerType = computed(() => (props.isGraded ? 'Answer' : 'Option'));
const buttonLabel = computed(() => (isExpanded.value ? 'hide' : 'show'));
const processedAnswers = computed(() =>
  isArray(props.answers) ? props.answers : ['True', 'False'],
);

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};

watch(
  () => props.isEditing,
  (val) => {
    if (!some(props.feedback)) return;
    if (val) isExpanded.value = true;
  },
);
</script>
