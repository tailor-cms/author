<template>
  <div :class="{ collapsed }" class="exam">
    <div
      v-if="collapsed"
      class="d-flex justify-center align-center"
      @click="collapsed = false">
      <h3 class="ml-auto">{{ title }}</h3>
      <VChip
        color="green"
        text-color="white"
        label
        small
        class="ml-auto">
        <strong>{{ label }}</strong>
      </VChip>
    </div>
    <div v-else>
      <div class="header d-flex justify-space-between align-baseline">
        <h3 class="text-left">{{ title }}</h3>
        <div class="actions">
          <VBtn variant="text" @click="collapsed = true">
            Collapse
          </VBtn>
          <VBtn variant="text" @click="$emit('delete')">
            Delete
          </VBtn>
        </div>
      </div>
      <VAlert
        v-if="!groups.length"
        color="blue-grey-darken-3"
        icon="mdi-information-variant"
        text>
        Click the button below to Create first question group.
      </VAlert>
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
      <VBtn
        :disabled="!container.id"
        color="primary-darken-2"
        variant="outlined"
        class="my-5"
        @click.stop="createGroup">
        <VIcon class="pr-2">mdi-file-tree</VIcon>
        Add Question Group
      </VBtn>
    </div>
  </div>
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
  const activity = find(props.activities, { id: props.container.parentId });
  const objectiveTypes = get(props.config, 'objectives') as string[];
  if (!activity || !objectiveTypes) return [];
  if (activity.type === 'ASSESSMENT_GROUP') {
    const parent = find(props.activities, { id: activity.parentId });
    return get(parent, 'refs.objectives', []) as Activity[];
  }
  const children = activityUtils.getDescendants(
    Object.values(props.activities), activity,
  );
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
  color: #505050;
}

.exam {
  margin-bottom: 13px;
  box-shadow: 0 1px 4px rgb(0 0 0 / 30%);
  padding: 0;
  background-color: #fff;

  > div {
    padding: 15px 25px;
  }

  .header {
    min-height: 50px;
    padding: 5px;
  }
}

.collapsed {
  &:hover {
    background-color: #f0f0f0;
    cursor: pointer;
  }
}

.actions {
  > span {
    margin-left: 10px;
  }
}

.label {
  min-width: 40px;
  line-height: 12px;
}
</style>
