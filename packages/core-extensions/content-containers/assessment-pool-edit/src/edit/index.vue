<template>
  <div class="bg-transparent">
    <div class="d-flex justify-space-between align-center mb-4">
      <div class="text-white text-subtitle-1">Assessments</div>
      <VBtn
        v-if="hasAssessments"
        variant="tonal"
        size="small"
        color="primary-lighten-3"
        @click="toggleAssessments"
      >
        {{ allSelected ? 'Hide' : 'Show' }} All
      </VBtn>
    </div>
    <VAlert
      v-if="!hasAssessments"
      color="primary-lighten-3"
      icon="mdi-information-outline"
      variant="tonal"
      prominent
    >
      Click the button below to create first Assessment.
    </VAlert>
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
      v-if="!disabled"
      :activity="container"
      :include="include"
      :items="assessments"
      :layout="false"
      :position="assessments.length"
      class="mt-6"
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
import { ref, computed, watch, inject } from 'vue';
import { AddElement, AssessmentItem } from '@tailor-cms/core-components';
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
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

const selected = ref<string[]>([]);
const allSelected = ref(false);

const hasAssessments = computed(() => assessments.value.length > 0);

const include = computed(() => {
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

const toggleSelect = (uid: string) => isSelected(uid)
  ? pull(selected.value, uid)
  : selected.value.push(uid);

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
