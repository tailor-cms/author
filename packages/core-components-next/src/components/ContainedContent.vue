<template>
  <VCol
    :class="[{ disabled: isDisabled, hovered: isHovered }]"
    :cols="elementWidth"
    class="contained-content"
    @dragend="emit('dragend')"
    @dragover="scrollContainer"
    @dragstart="emit('dragstart')"
    @focusin="isHovered = true"
    @focusout="isHovered = false"
    @mouseleave="isHovered = false"
    @mouseover="isHovered = true"
  >
    <span v-if="!isDisabled" class="drag-handle">
      <span class="mdi mdi-drag-vertical"></span>
    </span>
    <ContentElement
      v-bind="bindings"
      @add="$emit('add', $event)"
      @delete="$emit('delete')"
      @save="$emit('save', $event)"
      @save:meta="$emit('save:meta', $event)"
    />
  </VCol>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import get from 'lodash/get';
import throttle from 'lodash/throttle';

import ContentElement from './ContentElement.vue';

const props = defineProps({
  element: { type: Object, required: true },
  isDisabled: { type: Boolean, default: false },
  isDragged: { type: Boolean, default: false },
  showDiscussion: { type: Boolean, default: false },
  setWidth: { type: Boolean, default: true },
  dense: { type: Boolean, default: false },
});

const emit = defineEmits([
  'add',
  'delete',
  'dragend',
  'dragstart',
  'save',
  'save:meta',
]);

const isHovered = ref(false);

const bindings = computed(() => {
  const { element, isDisabled, isDragged, dense, showDiscussion } = props;
  return {
    element,
    isDisabled,
    isDragged,
    isHovered: isHovered.value,
    showDiscussion,
    dense,
  };
});

const elementWidth = computed(() => {
  return props.setWidth ? get(props.element, 'data.width', 12) : undefined;
});

const scrollContainer = throttle((e) => {
  const scrollUp = e.y < 200;
  const scrollDown = e.y > window.innerHeight - 200;
  if (scrollUp || scrollDown) window.scrollBy(0, scrollUp ? -30 : 30);
}, 20);
</script>

<style lang="scss" scoped>
.drag-handle {
  position: absolute;
  left: -0.1875rem;
  z-index: 2;
  width: 1.625rem;
  opacity: 0;

  .mdi {
    color: #888;
    font-size: 1.75rem;
  }
}

.hovered .drag-handle {
  opacity: 1;
  transition: opacity 0.6s ease-in-out;
  cursor: pointer;
}

.disabled .drag-handle {
  display: none;
}

.contained-content {
  position: relative;
  margin: 7px 0;
  padding: 0;
}
</style>
