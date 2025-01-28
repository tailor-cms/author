<template>
  <VCard class="assessment-group">
    <VSheet class="d-flex align-center ga-2 px-4 py-3">
      <VIcon icon="mdi-help-circle" size="small" />
      <h3>Question group {{ numberToLetter(position) }}</h3>
      <VSpacer />
      <VBtn
        variant="tonal"
        color="secondary-darken-1"
        size="small"
        @click="$emit('delete')"
      >
        Delete Group
      </VBtn>
    </VSheet>
    <VDivider />
    <div class="pa-6">
      <VTextField
        v-model.number="timeLimit"
        min="0"
        name="timeLimit"
        label="Time limit"
        type="number"
        step="15"
        suffix="min"
        persistent-hint
        variant="outlined"
        @keydown="e => ['e', '+', '-', '.'].includes(e.key) && e.preventDefault()"
      />
      <h4 class="text-left">Introduction</h4>
      <GroupIntroduction
        :group="group"
        :elements="introductionElements"
        @save:element="$emit('save:element', $event)"
        @reorder:element="$emit('reorder:element', $event)"
        @delete:element="$emit('delete:element', $event)" />
      <h4 class="text-left mb-2">Questions</h4>
      <VAlert
        v-if="!hasAssessments"
        class="mt-4"
        color="primary-darken-1"
        icon="mdi-information-outline"
        variant="tonal"
        prominent
      >
        Click the button below to create first Assessment.
      </VAlert>
      <ElementList
        :elements="assessments"
        :activity="group"
        :supported-element-config="supportedElementConfig"
        class="px-0"
        @add="addAssessments"
        @update="$emit('reorder:element', $event)">
        <template #default="{ element }">
          <AssessmentItem
            :assessment="element"
            :objectives="objectives"
            :objective-label="objectiveLabel"
            @save="saveAssessment"
            @delete="deleteAssessment(element)" />
        </template>
      </ElementList>
    </div>
  </VCard>
</template>

<script lang="ts" setup>
import { defineProps, ref, computed, watch, inject } from 'vue';
import { numberToLetter, uuid } from '@tailor-cms/utils';
import type { Activity } from '@tailor-cms/interfaces/activity';
import cloneDeep from 'lodash/cloneDeep';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import debounce from 'lodash/debounce';
import { ElementList } from '@tailor-cms/core-components';
import type { ElementRegistry } from '@tailor-cms/interfaces/schema';
import filter from 'lodash/filter';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import map from 'lodash/map';
import pickBy from 'lodash/pickBy';
import sortBy from 'lodash/sortBy';
import uniq from 'lodash/uniq';

import AssessmentItem from './Assessment.vue';
import GroupIntroduction from './GroupIntroduction.vue';

const props = defineProps<{
  group: Activity;
  elements: Record<string, ContentElement>;
  objectives: Activity[];
  position: number;
}>();

const emit = defineEmits([
  'update',
  'delete',
  'save:element',
  'update:element',
  'reorder:element',
  'delete:element',
]);

const schemaService = inject<any>('$schemaService');
const ceRegistry = inject<ElementRegistry>('$ceRegistry');

const unsavedAssessments = ref<Record<string, any>>({});
const timeLimit = ref<number>(get(props.group, 'data.timeLimit', 0));

const questionTypes = computed(() => map(ceRegistry?.questions, 'type'));
const savedAssessments = computed(() => {
  const filtered = filter(props.elements, (el) => {
    return el.activityId === props.group.id && isQuestion(el.type);
  });
  return sortBy(filtered, 'position');
});

const introductionElements = computed(() => {
  const cond = (it: any) => it.activityId === props.group.id && !isQuestion(it.type);
  return sortBy(filter(props.elements, cond), 'position');
});

const assessments = computed(() => {
  return sortBy([
    ...savedAssessments.value,
    ...Object.values(unsavedAssessments.value),
  ], 'position');
});

const hasAssessments = computed(() => {
  return !isEmpty(assessments.value);
});

const objectiveLabel = computed(() => {
  if (isEmpty(props.objectives)) return '';
  const types = uniq(map(props.objectives, 'type'));
  const label = types.length > 1
    ? 'Objective'
    : schemaService.getLevel(types[0]).label;
  return `Link ${label}`;
});

const supportedElementConfig = computed(() => {
  const items = questionTypes.value.map((id) => ({ id, isGradable: true }));
  return [{ name: 'Assessments', items }];
});

const isQuestion = (type: string) => questionTypes.value.includes(type);

const addAssessments = (assessments: Array<any>) => {
  assessments.forEach((it) => {
    const uid = uuid();
    unsavedAssessments.value[uid] = { ...it, uid };
  });
};

const saveAssessment = (assessment: any) => {
  emit(assessment.id ? 'update:element' : 'save:element', assessment);
};

const deleteAssessment = (assessment: any) => {
  if (!assessment.id) return clearUnsavedAssessments([assessment]);
  emit('delete:element', assessment);
};

const clearUnsavedAssessments = (assessments: Array<any>) => {
  const ids = assessments.map((it) => it.uid);
  const cond = (it: any) => !ids.includes(it.uid);
  unsavedAssessments.value = pickBy(unsavedAssessments.value, cond);
};

watch(savedAssessments, clearUnsavedAssessments);

watch(timeLimit, debounce((val: number) => {
  const group = cloneDeep(props.group);
  group.data = group.data || {};
  group.data.timeLimit = val;
  emit('update', group);
}, 1500));
</script>

<style lang="scss" scoped>
.remove {
  float: right;
  margin: 10px 5px;
  font-size: 22px;

  &:hover {
    cursor: pointer;
  }
}

:deep(.list-group) > .v-row > .v-col {
  padding: 0.25rem 0.75rem;
}

.time-limit {
  margin: 7px 20px;

  label {
    margin-right: 5px;
    vertical-align: bottom;
  }

  input {
    width: 50px;
    text-align: center;
  }
}
</style>
