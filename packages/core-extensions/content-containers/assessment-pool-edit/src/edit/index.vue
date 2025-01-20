<template>
  <div class="bg-transparent">
    <div class="text-left d-flex justify-space-between align-center mb-4">
      <div class="text-white text-subtitle-1">Assessments</div>
      <VBtn
        v-if="hasAssessments"
        variant="tonal"
        size="small"
        color="white"
        @click="toggleAssessments"
      >
        {{ allSelected ? 'Hide All' : 'Show All' }}
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
    <div v-else class="d-flex flex-column ga-2">
      <AssessmentItem
        v-for="it in assessments"
        :key="it.uid"
        :element="it"
        :embed-element-config="embedElementConfig"
        :expanded="isSelected(it)"
        :is-disabled="disabled"
        @selected="toggleSelect(it)"
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
      class="mt-8"
      label="Add assessment"
      large
      color="teal-accent-1"
      variant="tonal"
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
import { filter, sortBy } from 'lodash';
import { uuid } from '@tailor-cms/utils';
import pull from 'lodash/pull';

interface Props {
  container: Activity;
  elements: Record<string, any>;
  disabled: boolean;
  embedElementConfig?: ContentElementCategory[] | null;
  contentElementConfig?: ContentElementCategory[] | null;
}

const props = withDefaults(defineProps<Props>(), {
  embedElementConfig: null,
  contentElementConfig: null,
});

const emit = defineEmits([
  'add:element',
  'save:element',
  'delete:element',
  'update:element',
]);

const ceRegistry = inject<ElementRegistry>('$ceRegistry');
const include = computed(() => {
  const items = ceRegistry?.questions.map((it) =>
    ({ id: it.type, isGradable: true })) ?? [];
  return [{ name: 'Assessments', items }];
});

const selected = ref<string[]>([]);
const allSelected = ref(false);

const assessments = computed(() => {
  const activityId = props.container.id;
  const assessments = filter(props.elements, { activityId });
  return sortBy(assessments, 'position');
});

const hasAssessments = computed(() => assessments.value.length > 0);

const addAssessments = (newAssessments: any[]) => {
  newAssessments.forEach(it => {
    const uid = uuid();
    emit('add:element', { ...it, uid });
    selected.value.push(uid);
  });
};

const saveAssessment = (assessment: any) => {
  const event = assessment.id ? 'update:element' : 'save:element';
  emit(event, assessment);
};

const toggleSelect = (assessment: any) => isSelected(assessment)
  ? pull(selected.value, assessment.uid)
  : selected.value.push(assessment.uid);

const isSelected = (assessment: any) => selected.value.includes(assessment.uid);

const clearSelected = () => {
  const ids = assessments.value.map(it => it.uid);
  selected.value = selected.value.filter(it => ids.includes(it));
};

const toggleAssessments = () => {
  allSelected.value = !allSelected.value;
  selected.value = allSelected.value ? assessments.value.map(it => it.uid) : [];
};

watch(assessments, clearSelected);
</script>
