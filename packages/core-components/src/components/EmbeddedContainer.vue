<template>
  <ElementList
    :add-element-options="addElementOptions"
    :elements="embeds"
    :enable-add="!isDisabled && enableAdd"
    :supported-types="types"
    @add="addItems"
    @update="reorderItem"
  >
    <template #list-item="{ element, isDragged }">
      <ContainedContent
        :element="element"
        :is-disabled="isDisabled"
        :is-dragged="isDragged"
        v-bind="$attrs"
        class="my-2"
        @delete="requestDeleteConfirmation(element)"
        @save="save(element, 'data', $event)"
        @save:meta="save(element, 'meta', $event)"
      />
    </template>
  </ElementList>
</template>

<script lang="ts" setup>
import { calculatePosition } from '@tailor-cms/utils';
import cloneDeep from 'lodash/cloneDeep';
import { computed } from 'vue';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import mapKeys from 'lodash/mapKeys';
import sortBy from 'lodash/sortBy';

import ContainedContent from './ContainedContent.vue';
import ElementList from './ElementList.vue';
import { useConfirmationDialog } from '../composables/useConfirmationDialog';

const props = defineProps<{
  container: Record<string, any>;
  types: string[];
  isDisabled: boolean;
  addElementOptions: Record<string, any>;
  enableAdd: boolean;
}>();

const emits = defineEmits(['save', 'delete']);

const showConfirmationDialog = useConfirmationDialog();

const embeds = computed(() => {
  const items = Object.values(props.container.embeds ?? {});
  return sortBy(items, 'position') as ContentElement[];
});

const addItems = (items: ContentElement[]) => {
  items = Array.isArray(items) ? items : [items];
  const container = cloneDeep(props.container);
  container.embeds = { ...container.embeds, ...mapKeys(items, 'id') };
  emits('save', container);
};

const reorderItem = ({
  newPosition,
  items,
}: {
  newPosition: number;
  items: ContentElement[];
}) => {
  const context = { items, newPosition };
  const container = cloneDeep(props.container);
  const reordered = container.embeds[items[newPosition].id];
  reordered.position = calculatePosition(context);
  emits('save', container);
};

const save = (item: ContentElement, key: string, value: any) => {
  const container = cloneDeep(props.container);
  container.embeds[item.id] = { ...item, [key]: value };
  emits('save', container);
};

const requestDeleteConfirmation = (element: ContentElement) => {
  showConfirmationDialog({
    title: 'Delete element?',
    message: 'Are you sure you want to delete element?',
    action: () => emits('delete', element),
  });
};
</script>
