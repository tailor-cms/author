<template>
  <VCol
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
    <ContentElementWrapper
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
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import type { ContentElementCategory } from '@tailor-cms/interfaces/schema';
import { get, throttle } from 'lodash-es';

import ContentElementWrapper from './ContentElement/index.vue';

interface Props {
  element: ContentElement;
  embedElementConfig?: ContentElementCategory[];
  references?: Record<string, ContentElement[]> | null;
  isDisabled?: boolean;
  isDragged?: boolean;
  showDiscussion?: boolean;
  setWidth?: boolean;
  dense?: boolean;
  autosave?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  embedElementConfig: () => [],
  references: null,
  isDisabled: false,
  isDragged: false,
  showDiscussion: false,
  setWidth: true,
  dense: false,
  autosave: false,
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
  const {
    embedElementConfig,
    element,
    isDisabled,
    references,
    isDragged,
    dense,
    showDiscussion,
    autosave,
  } = props;
  return {
    element,
    embedElementConfig,
    references,
    isDisabled,
    isDragged,
    isHovered: isHovered.value,
    showDiscussion,
    dense,
    autosave,
  };
});

const elementWidth = computed(() => {
  return props.setWidth
    ? (get(props.element, 'data.width', 12) as number)
    : undefined;
});

const scrollContainer = throttle((e) => {
  const scrollUp = e.y < 200;
  const scrollDown = e.y > window.innerHeight - 200;
  if (scrollUp || scrollDown) window.scrollBy(0, scrollUp ? -30 : 30);
}, 20);
</script>

<style lang="scss" scoped>
.contained-content {
  position: relative;
  margin: 7px 0;
  padding: 0;
}
</style>
