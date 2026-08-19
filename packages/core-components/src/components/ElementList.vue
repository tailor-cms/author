<template>
  <VContainer class="list-group" fluid>
    <Draggable
      v-bind="options"
      :disabled="isReadonly"
      :list="elements"
      :item-key="getElementId"
      tag="VRow"
      @end="onDragEnd"
      @start="onDragStart"
      @update="reorder"
    >
      <template #item="{ element, index }">
        <VCol
          :key="getElementId(element)"
          :cols="getVal(element, 'data.width', 12)"
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
    <template v-if="enableAdd && !isReadonly">
      <slot
        :activity="activity"
        :include="supportedElementConfig"
        :layout="layout"
        :position="elements.length"
        name="list-add"
      >
        <AddElement
          :activity="activity"
          v-bind="addElementOptions"
          :include="supportedElementConfig"
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
import { get as getVal } from 'lodash-es';

import AddElement from './AddElement/index.vue';

interface Props {
  elements?: ContentElement[];
  dragOptions?: any;
  supportedElementConfig?: ContentElementCategory[] | null;
  activity?: Activity | null;
  layout?: boolean;
  isReadonly?: boolean;
  enableAdd?: boolean;
  addElementOptions?: any;
}

const props = withDefaults(defineProps<Props>(), {
  elements: () => [],
  dragOptions: () => ({}),
  supportedElementConfig: null,
  activity: null,
  layout: false,
  isReadonly: false,
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

const onDragStart = (event: { oldIndex: number }) => {
  dragElementIndex.value = event.oldIndex;
  editorBus.emit('element:focus');
};

const onDragEnd = (event: { newIndex: number }) => {
  dragElementIndex.value = -1;
  const element = props.elements[event.newIndex];
  if (element) editorBus.emit('element:focus', element);
};

const reorder = (event: { newIndex: number }) => {
  const items = props.elements;
  emit('update', { newPosition: event.newIndex, items });
};
</script>

<style lang="scss" scoped>
:deep(.sortable-ghost) {
  .drag-handle {
    display: none;
  }

  .content-element {
    max-height: 9.375rem;
    background: rgb(var(--v-theme-surface-container-low));

    & > * {
      visibility: hidden;
    }
  }
}

:deep(.sortable-drag .content-element) {
  max-height: none;
  background: rgb(var(--v-theme-surface-container-low));
}
</style>
