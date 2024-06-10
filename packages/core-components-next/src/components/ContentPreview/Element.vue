<template>
  <VCol
    :cols="elementWidth"
    class="element-preview-container align-start float-none"
  >
    <VCheckbox
      v-if="selectable"
      :disabled="disabled"
      :model-value="isSelected"
      class="flex-shrink-0"
      color="primary-darken-4"
      @update:model-value="toggleSelection"
    />
    <VHover v-slot="{ isHovering, props: hoverProps }">
      <div v-bind="hoverProps" class="element-wrapper flex-grow-1">
        <Element
          v-bind="$attrs"
          :class="{ selected: isSelected }"
          :element="element"
          :set-width="false"
          class="content-element"
        />
        <VTooltip location="top" open-delay="400">
          <template #activator="{ props: tooltipProps }">
            <VBtn
              :class="{ visible: isHovering }"
              class="open-element-button"
              color="blue-grey-darken-4"
              v-bind="tooltipProps"
              icon="mdi-open-in-new"
              size="small"
              @click.stop="$emit('element:open', element.uid)"
            />
          </template>
          <span>Open in editor</span>
        </VTooltip>
      </div>
    </VHover>
  </VCol>
</template>

<script lang="ts" setup>
import { computed, defineProps } from 'vue';
import get from 'lodash/get';

import type { ContentElement } from '../../interfaces/content-element';
import Element from '../ContentElement.vue';

interface Props {
  element: ContentElement;
  selectable?: boolean;
  isSelected?: boolean;
  selectionDisabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  selectable: false,
  isSelected: false,
  selectionDisabled: false,
});

const emit = defineEmits(['element:open', 'toggle']);

const disabled = computed(() => props.selectionDisabled && !props.isSelected);
const elementWidth = computed(
  () => get(props.element, 'data.width', 12) as number,
);

const toggleSelection = () => {
  if (!props.selectable || disabled.value) return;
  return emit('toggle');
};
</script>

<style lang="scss" scoped>
.element-preview-container {
  position: relative;
  display: flex;
  margin: 0.25rem 0;
}

.content-element {
  flex: 1 0;
  margin: 0.4375rem 0 0 0.25rem;
  box-shadow: none;
  border: 1px solid #e1e1e1;

  &.selected {
    border-style: dashed;
    border-color: #444;

    &::after {
      display: none;
    }
  }
}

.element-preview-container ::v-deep .contained-content {
  margin: 0;

  .message span:not(.heading) {
    display: none;
  }

  .ql-editor {
    word-break: break-all;
  }
}

.element-wrapper {
  position: relative;
}

.open-element-button {
  position: absolute;
  top: 0;
  right: -0.75rem;
  transition: opacity 0.4s;

  &:not(.visible) {
    opacity: 0;
  }
}
</style>
