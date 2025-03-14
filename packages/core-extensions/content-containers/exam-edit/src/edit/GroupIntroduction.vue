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
      :activity="group"
      :elements="elements"
      :is-disabled="isDisabled"
      :supported-element-config="introductionElementConfig"
      class="pa-4"
      layout
      @add="$emit('save:element', $event)"
      @update="$emit('reorder:element', $event)"
    >
      <template #default="{ element, isDragged }">
        <ContainedContent
          :element="element"
          :is-disabled="isDisabled"
          :is-dragged="isDragged"
          :set-width="false"
          @delete="$emit('delete:element', element)"
          @save="save(element, $event)"
        />
      </template>
    </ElementList>
  </div>
</template>

<script lang="ts" setup>
import { ContainedContent, ElementList } from '@tailor-cms/core-components';
import type { Activity } from '@tailor-cms/interfaces/activity';
import { cloneDeep } from 'lodash-es';
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
