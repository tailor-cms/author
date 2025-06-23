<template>
  <VCard class="mb-4" color="primary-lighten-5">
    <VCard
      color="transparent"
      elevation="0"
      rounded="0"
      @click="isExamCollapsed = !isExamCollapsed"
    >
      <VRow class="d-flex justify-center align-center pa-4" no-gutters>
        <VCol
          :class="{ 'text-left': !isExamCollapsed }"
          :cols="isExamCollapsed ? 8 : 10"
          :offset="isExamCollapsed ? 2 : 0"
        >
          <div class="text-subtitle-1 font-weight-bold">
            {{ title }}
          </div>
        </VCol>
        <VCol cols="2" class="text-right">
          <VChip v-if="isExamCollapsed" color="green-darken-1" size="small">
            {{ label }}
          </VChip>
          <VBtn
            v-else-if="!disabled"
            color="secondary-darken-1"
            size="small"
            variant="tonal"
            @click.stop="emit('delete')"
          >
            Delete Exam
          </VBtn>
        </VCol>
      </VRow>
    </VCard>
    <VExpandTransition>
      <div v-if="!isExamCollapsed" class="px-6 py-4">
        <VAlert
          v-if="!groups.length"
          color="primary-darken-1"
          icon="mdi-information-outline"
          variant="tonal"
          prominent
        >
          Click the button below to Create first question group.
        </VAlert>
        <VExpansionPanels v-model="expandedAssessmentGroup" rounded="lg" flat>
          <AssessmentGroup
            v-for="(group, index) in groups"
            :key="group.uid"
            :elements="elements"
            :group="group"
            :is-disabled="disabled"
            :is-expanded="expandedAssessmentGroup === group.uid"
            :objectives="examObjectives"
            :position="index"
            @delete="deleteGroup(group)"
            @delete:element="$emit('delete:element', $event)"
            @reorder:element="$emit('reorder:element', $event)"
            @save:element="$emit('save:element', $event)"
            @update="$emit('update:subcontainer', $event)"
            @update:element="$emit('update:element', $event)"
          />
        </VExpansionPanels>
        <VBtn
          v-if="!disabled"
          :disabled="!container.id"
          color="primary-darken-2"
          class="my-5"
          variant="tonal"
          @click.stop="createGroup"
        >
          <VIcon class="pr-2">mdi-folder-plus-outline</VIcon>
          Add Question Group
        </VBtn>
      </div>
    </VExpandTransition>
  </VCard>
</template>

<script lang="ts" setup>
import { activity as activityUtils, numberToLetter } from '@tailor-cms/utils';
import { computed, ref, watch } from 'vue';
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import type { ContentElementCategory } from '@tailor-cms/interfaces/schema';
import { filter, find, get, last } from 'lodash-es';
import pluralize from 'pluralize-esm';

import AssessmentGroup from './AssessmentGroup.vue';

interface Props {
  name: string;
  container: Activity;
  elements: Record<string, ContentElement>;
  position: number;
  activities: Record<string, Activity>;
  embedElementConfig?: ContentElementCategory[];
  contentElementConfig?: ContentElementCategory[];
  config?: Record<string, any>;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  embedElementConfig: () => [],
  contentElementConfig: () => [],
  config: () => ({}),
  disabled: false,
});
const emit = defineEmits([
  'delete',
  'add:subcontainer',
  'save:element',
  'update:element',
  'reorder:element',
  'delete:element',
  'update:subcontainer',
  'delete:subcontainer',
]);

const isExamCollapsed = ref(!!props.container.id);
const expandedAssessmentGroup = ref<string>();

const groups = computed(() =>
  filter(props.activities, { parentId: props.container.id }));

const title = computed(() => `Exam ${numberToLetter(props.position)}`);
const label = computed(() => {
  const groupTotal = groups.value.length;
  return `${groupTotal} ${pluralize('set', groupTotal)}`;
});

const examObjectives = computed(() => {
  const activities = Object.values(props.activities);
  const activity = find(activities, { id: props.container.parentId! });
  const objectiveTypes = get(props.config, 'objectives') as string[];
  if (!activity || !objectiveTypes) return [];
  const children = activityUtils.getDescendants(activities, activity);
  return filter(children, (it) => objectiveTypes.includes(it.type));
});

const createGroup = () => {
  emit('add:subcontainer', {
    type: 'ASSESSMENT_GROUP',
    parentId: props.container.id,
    position: (last(groups.value)?.position ?? 0) + 1,
  });
};

const deleteGroup = (group: Activity) => {
  const isExpanded = expandedAssessmentGroup.value === group.uid;
  emit('delete:subcontainer', group, 'group');
  if (isExpanded) expandedAssessmentGroup.value = undefined;
};

watch(() => groups.value.length, (val, oldVal) => {
  if (val < oldVal) return;
  expandedAssessmentGroup.value = last(groups.value)?.uid;
});
</script>
