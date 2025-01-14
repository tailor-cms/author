<template>
  <div class="assessments">
    <div class="heading">
      <h2 class="primary--text text-darken-3">
        Assessments
      </h2>
      <VBtn
        v-if="hasAssessments"
        variant="text"
        size="small"
        @click="toggleAssessments"
      >
        {{ allSelected ? 'hide all' : 'show all' }}
      </VBtn>
    </div>
    <VAlert
      :model-value="!hasAssessments"
      color="white"
      icon="mdi-information-variant"
    >
      Click the button below to create first assessment.
    </VAlert>
    <div class="pl-0">
      <AssessmentItem
        v-for="it in assessments"
        :key="it.uid"
        :assessment="it"
        :expanded="isSelected(it)"
        :is-disabled="isDisabled"
        @selected="toggleSelect(it)"
        @save="saveAssessment"
        @delete="$emit('delete:element', it)"
      />
    </div>
    <AddElement
      v-if="!isDisabled"
      :activity="container"
      :include="[]"
      :items="assessments"
      :layout="false"
      :position="assessments.length"
      label="Add assessment"
      large
      @add="addAssessments"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { AddElement, AssessmentItem } from '@tailor-cms/core-components';
import { filter, sortBy } from 'lodash';
import { uuid } from '@tailor-cms/utils';

const props = defineProps<{
  container: any;
  elements: Record<string, any>;
  isDisabled: boolean;
}>();
const emit = defineEmits([
  'add:element',
  'save:element',
  'delete:element',
  'update:element',
]);

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

const toggleSelect = (assessment: any) => {
  const { question } = assessment.data;
  const hasQuestion = question && question.length;
  if (isSelected(assessment) && !hasQuestion) {
    emit('delete:element', assessment);
  } else if (isSelected(assessment)) {
    selected.value.splice(selected.value.indexOf(assessment.uid), 1);
  } else {
    selected.value.push(assessment.uid);
  }
};

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

<style lang="scss" scoped>
.assessments {
  margin: 4rem 0 15rem;

  .v-alert {
    color: #555;
  }

  .heading {
    display: flex;
    justify-content: space-between;
    align-content: center;
    padding: 0 0 0.5rem 0.125rem;

    .v-btn {
      margin: 0.25rem 0 0;
      padding: 0;
    }
  }

  h2 {
    display: inline-block;
    margin: 0;
    font-size: 1.125rem;
    line-height: 1.875rem;
    vertical-align: middle;
  }
}
</style>
