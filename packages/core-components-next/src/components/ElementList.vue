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
          :color="addElementOptions.color"
          :icon="addElementOptions.icon"
          :include="supportedTypes"
          :items="elements"
          :label="addElementOptions.label"
          :large="addElementOptions.large"
          :layout="layout"
          :position="addElementOptions.position || elements.length"
          :show="addElementOptions.show"
          :variant="addElementOptions.variant"
          class="mt-6"
          @add="emit('add', $event)"
        />
      </slot>
    </template>
  </VContainer>
</template>

<script lang="ts" setup>
import { computed, defineEmits, defineProps, inject, ref } from 'vue';
import Draggable from 'vuedraggable';
import { getElementId } from '@tailor-cms/utils';
import getVal from 'lodash/get';

import AddElement from './AddElement/index.vue';

const props = defineProps({
  elements: { type: Array, default: () => [] },
  dragOptions: { type: Object, default: () => ({}) },
  supportedTypes: { type: Array, default: null },
  activity: { type: Object, default: null },
  layout: { type: Boolean, default: false },
  isDisabled: { type: Boolean, default: false },
  enableAdd: { type: Boolean, default: true },
  addElementOptions: { type: Object, default: () => ({}) },
});

const emit = defineEmits(['add', 'update']);

const editorBus = inject('$editorBus') as any;
const dragElementIndex = ref<number>(-1);

const options = computed(() => ({
  ...props.dragOptions,
  handle: '.drag-handle',
}));

const onDragStart = (index) => {
  dragElementIndex.value = index;
  editorBus.emit('element:focus');
};

const onDragEnd = (element) => {
  dragElementIndex.value = -1;
  editorBus.emit('element:focus', element);
};

const reorder = ({ newIndex: newPosition }) => {
  const items = props.elements;
  emit('update', { newPosition, items });
};
</script>

<style lang="scss" scoped>
/* Do not remove! Makes sure vuedraggable detects correct scrollable parent */
.list-group {
  padding: 0.625rem 1.5rem;
}

::v-deep .sortable-ghost {
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

::v-deep .sortable-drag .content-element {
  max-height: auto;
  background: #fff;
}
</style>
