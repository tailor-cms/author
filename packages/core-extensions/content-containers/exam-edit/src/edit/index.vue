<template>
  <VCard :class="{ collapsed }" class="exam">
    <VCard
      rounded="0"
      elevation="0"
      color="transparent"
      @click="collapsed = !collapsed"
    >
      <VRow class="d-flex justify-center align-center py-4 px-4" no-gutters>
        <VCol
          :class="{ 'text-left': !collapsed }"
          :cols="collapsed ? 8 : 10"
          :offset="collapsed ? 2 : 0"
        >
          <h3 class="text-subtitle-1 font-weight-bold">
            {{ title }}
          </h3>
        </VCol>
        <VCol cols="2" class="text-right">
          <VChip v-if="collapsed" color="green-darken-1" size="small">
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
      <div v-if="!collapsed" class="px-8 py-4">
        <VAlert
          v-if="!groups.length"
          color="primary-darken-1"
          icon="mdi-information-variant"
          variant="tonal"
          prominent
        >
          Click the button below to Create first question group.
        </VAlert>
        <VExpansionPanels v-model="expanded" rounded="lg" flat>
          <AssessmentGroup
            v-for="(group, index) in groups"
            :key="group.uid"
            :group="group"
            :elements="elements"
            :is-disabled="disabled"
            :objectives="examObjectives"
            :position="index"
            :is-expanded="expanded === group.uid"
            @save:element="$emit('save:element', $event)"
            @update:element="$emit('update:element', $event)"
            @reorder:element="$emit('reorder:element', $event)"
            @delete:element="$emit('delete:element', $event)"
            @update="$emit('update:subcontainer', $event)"
            @delete="$emit('delete:subcontainer', group, 'group')" />
        </VExpansionPanels>
        <VBtn
          v-if="!disabled"
          :disabled="!container.id"
          color="primary-lighten-5"
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

const expanded = ref<string>();
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
