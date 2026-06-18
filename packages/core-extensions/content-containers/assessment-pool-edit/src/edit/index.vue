<template>
  <div>
    <div class="d-flex align-center mb-4">
      <div class="text-title-medium">Assessments</div>
      <VSpacer />
      <div v-if="!isAiGeneratingContent" class="pb-1 d-flex ga-2">
        <VBtn
          v-if="isAiEnabled && !disabled"
          color="tertiary"
          size="small"
          variant="tonal"
          text="Generate questions"
          append-icon="mdi-shimmer"
          @click="generateQuestions"
        />
        <VBtn
          v-if="hasAssessments"
          :text="allSelected ? 'Hide All' : 'Show All'"
          width="74"
          variant="tonal"
          size="small"
          rounded="lg"
          @click="toggleAssessments"
        />
      </div>
    </div>
    <VAlert
      v-if="!hasAssessments && !isAiGeneratingContent"
      :text="disabled
        ? 'Empty assessment pool'
        : 'Click the button below to create first Assessment.'"
      icon="mdi-information-outline"
      variant="tonal"
      prominent
    />
    <VSheet
      v-else-if="isAiGeneratingContent"
      color="surface-container"
      class="py-16 text-title-small"
      rounded="lg"
    >
      <CircularProgress />
      <div class="pt-3 font-weight-bold">Content generation in progress...</div>
    </VSheet>
    <div v-else class="d-flex flex-column ga-2">
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
      color="primary"
      label="Add assessment"
      variant="flat"
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
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import {
  AddElement,
  AssessmentItem,
  CircularProgress,
} from '@tailor-cms/core-components';
import { AiRequestType, AiResponseSchema } from '@tailor-cms/interfaces/ai';
import { computed, inject, ref, watch } from 'vue';
import { filter, map, pull, sortBy } from 'lodash-es';
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
        type: hasAssessments ? AiRequestType.Add : AiRequestType.Create,
        text: 'Generate 5 questions.',
        responseSchema: AiResponseSchema.Question,
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
