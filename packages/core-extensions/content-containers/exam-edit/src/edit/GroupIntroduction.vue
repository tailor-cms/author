<template>
  <div class="group-introduction">
    <ElementList
      :elements="introductionElements"
      :activity="group"
      :supported-types="[]"
      :layout="true"
      @add="$emit('save:element', $event)"
      @update="$emit('reorder:element', $event)">
      <template #default="{ element, isDragged }">
        <ContainedContent
          :element="element"
          :set-width="false"
          :is-dragged="isDragged"
          @save="save(element, $event)"
          @delete="$emit('delete:element', element)" />
      </template>
    </ElementList>
  </div>
</template>

<script lang="ts" setup>
import { ContainedContent, ElementList } from '@tailor-cms/core-components';
import cloneDeep from 'lodash/cloneDeep';
import filter from 'lodash/filter';
import sortBy from 'lodash/sortBy';
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import { computed } from 'vue';

const props = defineProps<{
  group: Activity;
  elements: Record<string, ContentElement>;
}>();
const emit = defineEmits([
  'save:element',
  'reorder:element',
  'delete:element',
]);

const introductionElements = computed(() => {
  // TODO: Add isQuestion
  const cond = (it: any) => it.activityId === props.group.id;
  return sortBy(filter(props.elements, cond), 'position');
});

const save = (element: any, data: any) => {
  element = cloneDeep(element);
  Object.assign(element.data, data);
  emit('save:element', element);
};
</script>

<style lang="scss" scoped>
.group-introduction {
  margin: 30px 0;
  min-height: 150px;
  padding: 5px 15px;
}
</style>
