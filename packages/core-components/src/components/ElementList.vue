<template>
  <VContainer class="list-group">
    <Draggable
      v-bind="options"
      :disabled="isDisabled"
      :list="elements"
      item-key="uid"
      tag="VRow"
      @end="dragElementIndex = -1"
      @start="dragElementIndex = $event.oldIndex"
      @update="reorder"
    >
      <template #item="{ element, index }">
        <VCol
          :key="getElementId(element)"
          :cols="getVal(element, 'data.width', 12)"
          class="pr-5"
          @dragend="onDragEnd(element)"
          @dragstart="onDragStart(index)"
        >
          <slot
            :element="element"
            :is-dragged="dragElementIndex === index"
            :position="index"
            name="default"
          >
          </slot>
        </VCol>
      </template>
    </Draggable>
    <template v-if="enableAdd && !isDisabled">
      <slot
        :activity="activity"
        :include="supportedTypes"
        :layout="layout"
        :position="elements.length"
        name="list-add"
      >
        <AddElement
          :activity="activity"
          v-bind="addElementOptions"
          :include="supportedTypes"
          :items="elements"
          :layout="layout"
          :position="addElementOptions.position || elements.length"
          class="mt-6"
          @add="emit('add', $event)"
        />
      </slot>
    </template>
  </VContainer>
</template>

<script lang="ts" setup>
import { computed, inject, ref } from 'vue';
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import Draggable from 'vuedraggable/src/vuedraggable';
import type { ContentElementCategory } from '@tailor-cms/interfaces/schema';
import { getElementId } from '@tailor-cms/utils';
import getVal from 'lodash/get';

import AddElement from './AddElement/index.vue';

interface Props {
  elements?: ContentElement[];
  dragOptions?: any;
  supportedTypes?: ContentElementCategory[] | null;
  activity?: Activity | null;
  layout?: boolean;
  isDisabled?: boolean;
  enableAdd?: boolean;
  addElementOptions?: any;
}

const props = withDefaults(defineProps<Props>(), {
  elements: () => [],
  dragOptions: () => ({}),
  supportedTypes: null,
  activity: null,
  layout: false,
  isDisabled: false,
  enableAdd: true,
  addElementOptions: () => ({}),
});

const emit = defineEmits(['add', 'update']);

const editorBus = inject<any>('$editorBus');
const dragElementIndex = ref<number>(-1);

const options = computed(() => ({
  ...props.dragOptions,
  handle: '.drag-handle',
}));

const onDragStart = (index: number) => {
  dragElementIndex.value = index;
  editorBus.emit('element:focus');
};

const onDragEnd = (element: ContentElement) => {
  dragElementIndex.value = -1;
  editorBus.emit('element:focus', element);
};

const reorder = ({ newIndex: newPosition }: { newIndex: number }) => {
  const items = props.elements;
  emit('update', { newPosition, items });
};
</script>

<style lang="scss" scoped>
/* Do not remove! Makes sure vuedraggable detects correct scrollable parent */
.list-group {
  padding: 0.625rem 1.5rem;
}

:deep(.sortable-ghost) {
  .drag-handle {
    display: none;
  }

  .content-element {
    max-height: 9.375rem;
    background: #f4f5f5;

    & > * {
      visibility: hidden;
    }
  }
}

:deep(.sortable-drag .content-element) {
  max-height: auto;
  background: #fff;
}
</style>
