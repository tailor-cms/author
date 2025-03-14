<template>
  <VExpansionPanel :value="group.uid" class="assessment-group">
    <VHover v-slot="{ isHovering, props: hoverProps }">
      <VExpansionPanelTitle v-bind="hoverProps" min-height="64" static>
        <div class="text-subtitle-1 font-weight-bold">
          Question group {{ numberToLetter(position) }}
        </div>
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
        label="Time limit"
        min="0"
        name="timeLimit"
        step="15"
        suffix="min"
        type="number"
        variant="outlined"
        persistent-hint
        @keydown="e => ['e', '+', '-', '.'].includes(e.key) && e.preventDefault()"
      />
      <div class="text-subtitle-2 text-left">Introduction</div>
      <GroupIntroduction
        :elements="introductionElements"
        :group="group"
        :is-disabled="isDisabled"
        @delete:element="$emit('delete:element', $event)"
        @reorder:element="$emit('reorder:element', $event)"
        @save:element="$emit('save:element', $event)"
      />
      <div class="text-subtitle-2 text-left mb-2">Questions</div>
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
        :activity="group"
        :elements="assessments"
        :is-disabled="isDisabled"
        :supported-element-config="supportedElementConfig"
        class="px-0"
        @add="addAssessments"
        @update="$emit('reorder:element', $event)"
      >
        <template #default="{ element }">
          <AssessmentItem
            :assessment="element"
            :is-disabled="isDisabled"
            :objectives="objectives"
            :objective-label="objectiveLabel"
            @delete="deleteAssessment(element)"
            @save="saveAssessment"
          />
        </template>
      </ElementList>
    </VExpansionPanelText>
  </VExpansionPanel>
</template>

<script lang="ts" setup>
import {
  cloneDeep,
  debounce,
  filter,
  get,
  isEmpty,
  map,
  pickBy,
  sortBy,
  uniq,
} from 'lodash-es';
import { computed, inject, ref, watch } from 'vue';
import { numberToLetter, uuid } from '@tailor-cms/utils';
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import { ElementList } from '@tailor-cms/core-components';
import type { ElementRegistry } from '@tailor-cms/interfaces/schema';

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
  const filtered = filter(props.elements, ({ activityId, type }) => {
    return activityId === props.group.id && isQuestion(type);
  });
  return sortBy(filtered, 'position');
});

const introductionElements = computed(() => {
  const filtered = filter(props.elements, ({ activityId, type }) => {
    return activityId === props.group.id && !isQuestion(type);
  });
  return sortBy(filtered, 'position');
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

const isQuestion = (type: string) => ceRegistry?.isQuestion(type) ?? false;

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

:deep(.list-group) > .v-row > .v-col {
  padding: 0.25rem 0.75rem;
}
</style>
