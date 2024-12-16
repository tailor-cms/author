<template>
  <div class="feedback-container">
    <div class="mb-2">
      <span class="text-subtitle-2">Feedback</span>
      <VBtn
        class="ml-2"
        color="primary-darken-4"
        size="small"
        variant="text"
        @click="isExpanded = !isExpanded"
      >
        {{ buttonLabel }}
      </VBtn>
    </div>
    <VExpandTransition>
      <div v-show="isExpanded">
        <div
          v-for="(answer, index) in processedAnswers"
          :key="index"
          class="text-subtitle-2 mb-6"
        >
          <div class="mb-4">
            {{ answerType }} {{ index + 1 }}:
            {{ answer || 'Answer not added.' }}
          </div>
          <RichTextEditor
            v-if="props.isEditing"
            :model-value="feedback[index]"
            variant="outlined"
            hide-details
            @update:model-value="update($event, index)"
          />
          <template v-else>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div v-if="feedback[index]" v-html="feedback[index]"></div>
            <span v-else class="font-italic">Feedback not added.</span>
          </template>
        </div>
      </div>
    </VExpandTransition>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { isArray, some } from 'lodash';

import RichTextEditor from '../RichTextEditor/index.vue';

const props = defineProps<{
  answers: Array<string> | boolean | null;
  feedback: Record<string, string>;
  isEditing: boolean;
  isGradable: boolean;
}>();
const emit = defineEmits(['update']);

const isExpanded = ref(some(props.feedback));
const answerType = computed(() => (props.isGradable ? 'Answer' : 'Option'));
const buttonLabel = computed(() => (isExpanded.value ? 'hide' : 'show'));
const processedAnswers = computed(() =>
  isArray(props.answers) ? props.answers : ['True', 'False'],
);

const update = (value: string, index: number) => {
  emit('update', { ...props.feedback, [index]: value });
};

watch(
  () => props.isEditing,
  (val) => {
    if (!some(props.feedback)) return;
    if (val) isExpanded.value = true;
  },
);
</script>
