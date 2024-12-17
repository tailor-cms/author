<template>
  <ElementList
    :add-element-options="addElementOptions"
    :elements="embeds"
    :enable-add="!isDisabled && enableAdd"
    :supported-types="types"
    @add="addItems"
    @update="reorderItem"
  >
    <template #default="{ element, isDragged }">
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
import { computed, inject } from 'vue';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import type { ElementCategory } from '@tailor-cms/interfaces/schema';
import mapKeys from 'lodash/mapKeys';
import sortBy from 'lodash/sortBy';

import { useConfirmationDialog } from '../composables/useConfirmationDialog';
import ContainedContent from './ContainedContent.vue';
import ElementList from './ElementList.vue';

interface Props {
  types: ElementCategory[];
  container: { embeds: Record<string, ContentElement> };
  isDisabled?: boolean;
  enableAdd?: boolean;
  addElementOptions?: Record<string, any>;
}

const props = withDefaults(defineProps<Props>(), {
  isDisabled: false,
  enableAdd: true,
  types: () => [],
  addElementOptions: () => ({}),
});
const emit = defineEmits(['save', 'delete']);

const editorBus = inject<any>('$editorBus');
const showConfirmationDialog = useConfirmationDialog();

const embeds = computed(() => {
  const items = Object.values(props.container.embeds ?? {});
  return sortBy(items, 'position') as ContentElement[];
});

const addItems = (items: ContentElement[]) => {
  items = Array.isArray(items) ? items : [items];
  const container = cloneDeep(props.container);
  container.embeds = { ...container.embeds, ...mapKeys(items, 'id') };
  emit('save', container);
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
  reordered.position = calculatePosition(context) as number;
  emit('save', container);
};

const save = (item: ContentElement, key: string, value: any) => {
  const container = cloneDeep(props.container);
  container.embeds[item.id] = { ...item, [key]: value };
  emit('save', container);
};

const requestDeleteConfirmation = (element: ContentElement) => {
  showConfirmationDialog({
    title: 'Delete element?',
    message: 'Are you sure you want to delete element?',
    action: () => {
      emit('delete', element);
      editorBus.emit('element:focus');
    },
  });
};
</script>
