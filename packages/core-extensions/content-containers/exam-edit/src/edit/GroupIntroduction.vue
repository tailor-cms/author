<template>
  <div class="group-introduction">
    <VAlert
      v-if="!elements.length"
      class="mt-4"
      color="primary-darken-1"
      icon="mdi-information-outline"
      variant="tonal"
      prominent
    >
      Click the button below to create first Introduction item.
    </VAlert>
    <ElementList
      :elements="elements"
      :activity="group"
      :supported-element-config="introductionElementConfig"
      :is-disabled="isDisabled"
      layout
      class="pa-4"
      @add="$emit('save:element', $event)"
      @update="$emit('reorder:element', $event)">
      <template #default="{ element, isDragged }">
        <ContainedContent
          :element="element"
          :set-width="false"
          :is-dragged="isDragged"
          :is-disabled="isDisabled"
          @save="save(element, $event)"
          @delete="$emit('delete:element', element)" />
      </template>
    </ElementList>
  </div>
</template>

<script lang="ts" setup>
import { ContainedContent, ElementList } from '@tailor-cms/core-components';
import type { Activity } from '@tailor-cms/interfaces/activity';
import cloneDeep from 'lodash/cloneDeep';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import { introductionElementConfig } from './config';

defineProps<{
  group: Activity;
  elements: ContentElement[];
  isDisabled: boolean;
}>();

const emit = defineEmits([
  'save:element',
  'reorder:element',
  'delete:element',
]);

const save = (element: any, data: any) => {
  element = cloneDeep(element);
  Object.assign(element.data, data);
  emit('save:element', element);
};
</script>
