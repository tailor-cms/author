<template>
  <VCard :class="{ collapsed }" class="exam" color="primary-darken-2" elevation="0">
    <VCard
      rounded="0"
      elevation="0"
      color="primary-darken-2"
      @click="collapsed = !collapsed"
    >
      <VRow class="d-flex justify-center align-center py-3 px-4" no-gutters>
        <VCol cols="2" class="text-left">
          <VChip color="green-accent-2" size="small">{{ label }}</VChip>
        </VCol>
        <VCol cols="8">
          <h3 class="text-subtitle-2 font-weight-bold text-left">
            {{ title }}
          </h3>
        </VCol>
        <VCol cols="2" class="text-right">
          <VBtn
            v-if="!collapsed && !disabled"
            color="secondary-lighten-4"
            size="small"
            variant="tonal"
            @click.stop="emit('delete')"
          >
            Delete Exam
          </VBtn>
        </VCol>
      </VRow>
    </VCard>
    <VDivider v-if="!collapsed" />
    <VExpandTransition>
      <div v-if="!collapsed" class="pa-4">
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
            :is-disabled="disabled"
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
          v-if="!disabled"
          :disabled="!container.id"
          color="primary-lighten-5"
          variant="tonal"
          class="my-5"
          @click.stop="createGroup">
          <VIcon class="pr-2">mdi-folder-plus-outline</VIcon>
          Add Question Group
        </VBtn>
      </div>
    </VExpandTransition>
  </VCard>
</template>

<script lang="ts" setup>
import { activity as activityUtils, numberToLetter } from '@tailor-cms/utils';
import { filter, find, get } from 'lodash';
import { computed, ref } from 'vue';
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import type { ContentElementCategory } from '@tailor-cms/interfaces/schema';
import pluralize from 'pluralize';

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
