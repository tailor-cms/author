<template>
  <div class="bg-transparent">
    <div class="d-flex align-center mb-6">
      <div class="text-primary-lighten-4 text-h6">Assessments</div>
      <VSpacer />
      <div v-if="!isAiGeneratingContent" class="pb-1">
        <VBtn
          v-if="isAiEnabled && !disabled"
          color="primary-lighten-4"
          size="small"
          variant="tonal"
          @click="generateQuestions"
        >
          Generate questions
          <VIcon class="pl-2" right>mdi-magic-staff</VIcon>
        </VBtn>
        <VBtn
          v-if="hasAssessments"
          class="ml-3"
          variant="tonal"
          size="small"
          min-width="100"
          color="primary-lighten-3"
          @click="toggleAssessments"
        >
          {{ allSelected ? 'Hide' : 'Show' }} All
        </VBtn>
      </div>
    </div>
    <VAlert
      v-if="!hasAssessments && !isAiGeneratingContent"
      color="primary-lighten-3"
      icon="mdi-information-outline"
      variant="tonal"
      prominent
    >
      Click the button below to create first Assessment.
    </VAlert>
    <VSheet
      v-else-if="isAiGeneratingContent"
      color="primary-darken-4"
      class="py-16 text-subtitle-2 rounded-lg"
    >
      <CircularProgress />
      <div class="pt-3 text-primary-lighten-4 font-weight-bold">
        <span>Content generation in progress...</span>
      </div>
    </VSheet>
    <div v-else class="d-flex flex-column ga-2 mb-11">
      <AssessmentItem
        v-for="it in assessments"
        :key="it.uid"
        :element="it"
        :embed-element-config="embedElementConfig"
        :expanded="isSelected(it.uid)"
        :is-disabled="disabled"
        @selected="toggleSelect(it.uid)"
        @save="saveAssessment"
        @delete="$emit('delete:element', it)"
      />
    </div>
    <AddElement
      v-if="!disabled && !isAiGeneratingContent"
      :activity="container"
      :include="include"
      :items="assessments"
      :layout="false"
      :position="assessments.length"
      class="mt-8"
      color="teal-accent-1"
      label="Add assessment"
      variant="tonal"
      large
      @add="addAssessments"
    />
  </div>
</template>

<script lang="ts" setup>
import type {
  ContentElementCategory,
  ElementRegistry,
} from '@tailor-cms/interfaces/schema';
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { AiInput } from '@tailor-cms/interfaces/ai';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import {
  AddElement,
  AssessmentItem,
  CircularProgress,
} from '@tailor-cms/core-components';
import { AiRequestType, AiResponseSchema } from '@tailor-cms/interfaces/ai';
import { computed, inject, ref, watch } from 'vue';
import filter from 'lodash/filter';
import map from 'lodash/map';
import pull from 'lodash/pull';
import sortBy from 'lodash/sortBy';
import { uuid } from '@tailor-cms/utils';

interface Props {
  container: Activity;
  elements: Record<string, ContentElement>;
  disabled: boolean;
  embedElementConfig?: ContentElementCategory[];
  contentElementConfig?: ContentElementCategory[];
}

const props = withDefaults(defineProps<Props>(), {
  embedElementConfig: () => [],
  contentElementConfig: () => [],
});

const emit = defineEmits([
  'add:element',
  'save:element',
  'delete:element',
  'update:element',
]);

const ceRegistry = inject<ElementRegistry>('$ceRegistry');
const doTheMagic = inject<any>('$doTheMagic');

const selected = ref<string[]>([]);
const allSelected = ref(false);
const isAiEnabled = computed(() => !!doTheMagic);
const isAiGeneratingContent = ref(false);

const generateQuestions = async () => {
  isAiGeneratingContent.value = true;
  const hasAssessments = assessments.value.length > 0;
  const context = {
    inputs: [
      {
        type: hasAssessments ? AiRequestType.ADD : AiRequestType.CREATE,
        text: 'Generate 5 questions.',
        responseSchema: AiResponseSchema.QUESTION,
      },
    ],
    content: assessments.value.length ? JSON.stringify(assessments.value) : '',
  };
  const elements = await doTheMagic({
    containerType: props.container.type,
    ...context,
  });
  elements.forEach((element: ContentElement, index: number) => {
    emit('save:element', {
      ...element,
      position: assessments.value.length + index,
      repositoryId: props.container.repositoryId,
      activityId: props.container.id,
    });
  });
  isAiGeneratingContent.value = false;
};

const hasAssessments = computed(() => assessments.value.length > 0);

const include = computed(() => {
  if (props.contentElementConfig) return props.contentElementConfig;
  const questions = ceRegistry?.questions ?? [];
  const items = questions.map(({ type }) => ({ id: type, isGradable: true }));
  return [{ name: 'Assessments', items }];
});

const assessments = computed(() => {
  const activityId = props.container.id;
  const assessments = filter(props.elements, { activityId });
  return sortBy(assessments, 'position');
});

const addAssessments = (newAssessments: ContentElement[]) => {
  newAssessments.forEach((it) => {
    const uid = uuid();
    emit('add:element', { ...it, uid });
    selected.value.push(uid);
  });
};

const saveAssessment = (assessment: ContentElement) => {
  const event = assessment.id ? 'update:element' : 'save:element';
  return emit(event, assessment);
};

const isSelected = (uid: string) => selected.value.includes(uid);

const toggleSelect = (uid: string) =>
  isSelected(uid) ? pull(selected.value, uid) : selected.value.push(uid);

const clearSelected = () => {
  const ids = map(assessments.value, 'uid');
  selected.value = selected.value.filter((id) => ids.includes(id));
};

const toggleAssessments = () => {
  allSelected.value = !allSelected.value;
  selected.value = allSelected.value ? map(assessments.value, 'uid') : [];
};

watch(assessments, clearSelected);
</script>
