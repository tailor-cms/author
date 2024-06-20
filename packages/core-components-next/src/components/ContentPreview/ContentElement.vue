<template>
  <VCol :cols="elementWidth" class="d-flex align-start my-1">
    <VCheckbox
      v-if="selectable"
      :disabled="selectionDisabled && !isSelected"
      :model-value="isSelected"
      class="flex-shrink-0 mr-2"
      color="primary-darken-4"
      @update:model-value="$emit('toggle')"
    />
    <VHover v-slot="{ isHovering, props: hoverProps }">
      <div v-bind="hoverProps" class="element-wrapper flex-grow-1 mr-2">
        <Element
          v-bind="$attrs"
          :class="{ selected: isSelected }"
          :element="element"
          :set-width="false"
        />
        <VTooltip location="bottom" open-delay="400">
          <template #activator="{ props: tooltipProps }">
            <VFadeTransition>
              <VBtn
                v-if="isHovering"
                class="open-element-button"
                color="blue-grey-darken-4"
                v-bind="tooltipProps"
                icon="mdi-open-in-new"
                size="small"
                @click="openInEditor(element)"
              />
            </VFadeTransition>
          </template>
          <span>Open in editor</span>
        </VTooltip>
      </div>
    </VHover>
  </VCol>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue';
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
defineEmits(['element:open', 'toggle']);

const eventBus = inject<any>('$eventBus');

const elementWidth = computed(
  () => get(props.element, 'data.width', 12) as number,
);

const openInEditor = (element: ContentElement) => {
  const { uid: elementId, activity } = element;
  eventBus.channel('app').emit('openElement', {
    repositoryId: activity?.repositoryId,
    activityId: activity?.id,
    elementId,
  });
};
</script>

<style lang="scss" scoped>
.content-element {
  border: 1px solid #e1e1e1;

  &.selected {
    border-style: dashed;
    border-color: #444;

    &::after {
      display: none;
    }
  }
}

.element-wrapper {
  position: relative;
}

.open-element-button {
  position: absolute;
  top: -0.75rem;
  right: -0.75rem;
}
</style>
