<template>
  <VContainer class="assessment-group">
    <div class="divider"></div>
    <!-- TODO: Add Validation -->
    <VRow justify="end" no-gutters class="pa-0">
      <VCol cols="2">
        <VTextField
          v-model.number="timeLimit"
          min="0"
          name="timeLimit"
          hint="Time limit (minutes)"
          type="number"
          step="15"
          persistent-hint
          @keydown="e => ['e', '+', '-', '.'].includes(e.key) && e.preventDefault()">
          <template #append-outer>
            <VIcon @click="$emit('delete')">mdi-delete</VIcon>
          </template>
        </VTextField>
      </VCol>
    </VRow>
    <h3>Question group {{ position }}</h3>
    <h4>Introduction</h4>
    <GroupIntroduction
      :group="group"
      :elements="elements"
      @save:element="$emit('save:element', $event)"
      @reorder:element="$emit('reorder:element', $event)"
      @delete:element="$emit('delete:element', $event)" />
    <h4>Questions</h4>
    <VAlert
      :value="!hasAssessments"
      color="blue-grey-darken-3"
      icon="mdi-information-variant"
      text>
      Click the button below to Create first Assessment.
    </VAlert>
    <ElementList
      :elements="assessments"
      :activity="group"
      :supported-types="[]"
      @add="addAssessments"
      @update="$emit('reorder:element', $event)">
      <template #list-item="{ element }">
        <AssessmentItem
          :assessment="element"
          :objectives="objectives"
          :objective-label="objectiveLabel"
          @save="saveAssessment"
          @delete="deleteAssessment(element)" />
      </template>
    </ElementList>
  </VContainer>
</template>

<script lang="ts" setup>
import { defineProps, ref, computed, watch, inject } from 'vue';
import type { Activity } from '@tailor-cms/interfaces/activity';
import { uuid } from '@tailor-cms/utils';
import cloneDeep from 'lodash/cloneDeep';
import debounce from 'lodash/debounce';
import { ElementList } from '@tailor-cms/core-components';
import filter from 'lodash/filter';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import map from 'lodash/map';
import pickBy from 'lodash/pickBy';
import sortBy from 'lodash/sortBy';
import uniq from 'lodash/uniq';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import GroupIntroduction from './GroupIntroduction.vue';
import AssessmentItem from './Assessment.vue';

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

const unsavedAssessments = ref<Record<string, any>>({});
const timeLimit = ref<number>(get(props.group, 'data.timeLimit', 0));

const savedAssessments = computed(() => {
  const cond = { activityId: props.group.id, type: 'ASSESSMENT' };
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
h3 {
  margin: 30px 5px;
  font-size: 18px;
  text-align: left;
  color: #444;
}

h4 {
  margin: 20px 5px;
  font-size: 16px;
  text-align: left;
  color: #444;
}

.assessment-group {
  margin: 30px 0;
  padding: 15px 20px;

  .assessment-item {
    margin-bottom: 12px;
  }

  + .assessment-group {
    .divider {
      margin: 20px 0 70px;
      border-top: 1px solid #e1e1e1;
    }
  }
}

.remove {
  float: right;
  margin: 10px 5px;
  font-size: 22px;
  color: #777;

  &:hover {
    cursor: pointer;
    color: #444;
  }
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
