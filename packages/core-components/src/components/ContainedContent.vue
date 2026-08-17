<template>
  <VCol
    :cols="elementWidth"
    class="contained-content"
    @dragend="emit('dragend')"
    @dragover="scrollContainer"
    @dragstart="emit('dragstart')"
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
import { computed } from 'vue';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import type { ContentElementCategory } from '@tailor-cms/interfaces/schema';
import { get, throttle } from 'lodash-es';

import ContentElementWrapper from './ContentElement/index.vue';

interface Props {
  element: ContentElement;
  embedElementConfig?: ContentElementCategory[];
  references?: Record<string, ContentElement[]> | null;
  // Proxied expansion state (see ContentElement `expanded`).
  expanded?: boolean | null;
  isReadonly?: boolean;
  isDragged?: boolean;
  showDiscussion?: boolean;
  setWidth?: boolean;
  autosave?: boolean;
  variant?: 'card' | 'field' | 'quiet';
}

const props = withDefaults(defineProps<Props>(), {
  embedElementConfig: () => [],
  references: null,
  expanded: null,
  isReadonly: false,
  isDragged: false,
  showDiscussion: false,
  setWidth: true,
  autosave: false,
  variant: 'card',
});

const emit = defineEmits([
  'add',
  'delete',
  'dragend',
  'dragstart',
  'save',
  'save:meta',
]);

const bindings = computed(() => {
  const {
    embedElementConfig,
    element,
    expanded,
    isReadonly,
    references,
    isDragged,
    showDiscussion,
    autosave,
    variant,
  } = props;
  return {
    element,
    embedElementConfig,
    references,
    expanded,
    isReadonly,
    isDragged,
    showDiscussion,
    autosave,
    variant,
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
