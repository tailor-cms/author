<template>
  <VCard :class="{ collapsed }" class="exam" color="primary-darken-2" elevation="0">
    <VRow
      v-if="collapsed"
      class="d-flex justify-center align-center py-3 px-4"
      no-gutters
      @click="collapsed = false"
    >
      <VCol cols="2" class="text-left">
        <VChip color="green-accent-2" size="small">{{ label }}</VChip>
      </VCol>
      <VCol cols="8">
        <h3>{{ title }}</h3>
      </VCol>
      <VCol cols="2" class="text-right">
      </VCol>
    </VRow>
    <div v-else class="py-3 px-4">
      <div class="d-flex justify-space-between align-baseline mb-3">
        <h3 class="text-left">{{ title }}</h3>
        <div>
          <VBtn
            class="mr-3"
            color="teal-lighten-4"
            size="small"
            variant="tonal"
            @click="collapsed = true"
          >
            Collapse
          </VBtn>
          <VBtn
            color="secondary-lighten-4"
            size="small"
            variant="tonal"
            @click="emit('delete')"
          >
            Delete Exam
          </VBtn>
        </div>
      </div>
      <VAlert
        v-if="!groups.length"
        color="primary-lighten-3"
        icon="mdi-information-variant"
        variant="tonal"
      >
        Click the button below to Create first question group.
      </VAlert>
      <div class="d-flex flex-column ga-4">
        <AssessmentGroup
          v-for="(group, index) in groups"
          :key="group.uid"
          :group="group"
          :elements="elements"
          :objectives="examObjectives"
          :position="index"
          @save:element="$emit('save:element', $event)"
          @update:element="$emit('update:element', $event)"
          @reorder:element="$emit('reorder:element', $event)"
          @delete:element="$emit('delete:element', $event)"
          @update="$emit('update:subcontainer', $event)"
          @delete="$emit('delete:subcontainer', group, 'group')" />
      </div>
      <VBtn
        :disabled="!container.id"
        color="primary-lighten-5"
        variant="tonal"
        class="my-5"
        @click.stop="createGroup">
        <VIcon class="pr-2">mdi-folder-plus-outline</VIcon>
        Add Question Group
      </VBtn>
    </div>
  </VCard>
</template>

<script lang="ts" setup>
import { activity as activityUtils, numberToLetter } from '@tailor-cms/utils';
import { filter, find, get } from 'lodash';
import { computed, ref } from 'vue';
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import pluralize from 'pluralize';

import AssessmentGroup from './AssessmentGroup.vue';

interface Props {
  container: Activity;
  position: number;
  activities: Record<string, Activity>;
  elements: Record<string, ContentElement>;
  config?: Record<string, any>;
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({}),
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

const collapsed = ref(!!props.container.id);

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
    position: groups.value.length + 1,
  });
};
</script>

<style lang="scss" scoped>
h3 {
  display: inline-block;
  margin: 0;
  padding: 0;
  font-size: 14px;
  text-align: left;
}

.exam {
  margin-bottom: 13px;
}

.collapsed {
  &:hover {
    background-color: #f0f0f0;
    cursor: pointer;
  }
}
</style>
