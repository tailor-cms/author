<template>
  <VExpansionPanel class="assessment-group" :value="group.uid">
    <VHover v-slot="{ isHovering, props: hoverProps }">
      <VExpansionPanelTitle
        v-bind="hoverProps"
        color="primary-lighten-5"
        min-height="64"
        static
      >
        <h3 class="text-subtitle-1 font-weight-bold">
          Question group {{ numberToLetter(position) }}
        </h3>
        <VSpacer />
        <VFadeTransition>
          <VBtn
            v-if="!isDisabled && (isExpanded || isHovering)"
            v-tooltip:bottom="{ text: 'Delete Group', openDelay: 300 }"
            class="mr-2"
            color="secondary-lighten-1"
            size="x-small"
            variant="tonal"
            icon
            @click.stop="$emit('delete')"
          >
            <VIcon icon="mdi-delete-outline" size="large" />
          </VBtn>
        </VFadeTransition>
      </VExpansionPanelTitle>
    </VHover>
    <VExpansionPanelText class="mt-4">
      <VTextField
        v-model.number="timeLimit"
        :readonly="isDisabled"
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
      <h4 class="text-subtitle-2 font-weight-bold text-left">Introduction</h4>
      <GroupIntroduction
        :group="group"
        :elements="introductionElements"
        @save:element="$emit('save:element', $event)"
        @reorder:element="$emit('reorder:element', $event)"
        @delete:element="$emit('delete:element', $event)" />
      <h4 class="text-subtitle-2 font-weight-bold text-left mb-2">Questions</h4>
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
        :is-disabled="isDisabled"
        class="px-0"
        @add="addAssessments"
        @update="$emit('reorder:element', $event)">
        <template #default="{ element }">
          <AssessmentItem
            :assessment="element"
            :objectives="objectives"
            :objective-label="objectiveLabel"
            :is-disabled="isDisabled"
            @save="saveAssessment"
            @delete="deleteAssessment(element)" />
        </template>
      </ElementList>
    </VExpansionPanelText>
  </VExpansionPanel>
</template>

<script lang="ts" setup>
import { computed, inject, ref, watch } from 'vue';
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

interface Props {
  group: Activity;
  elements: Record<string, ContentElement>;
  objectives: Activity[];
  position: number;
  isDisabled?: boolean;
  isExpanded?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isDisabled: false,
  isExpanded: false,
});

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
.v-expansion-panel {
  border: thin solid rgba(0, 0, 0, 0.12);
}

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
