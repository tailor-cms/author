<template>
  <VAlert
    v-if="!elements.length"
    class="text-center"
    color="primary-darken-2"
    height="300"
    variant="tonal"
  >
    No available elements.
  </VAlert>
  <VRow v-for="container in processedContainers" :key="container.id">
    <Element
      v-for="element in container.elements"
      :key="element.id"
      :element="element"
      :is-selected="!!selectionMap[element.id]"
      :selectable="selectable"
      :selection-disabled="isSelectionDisabled"
      is-disabled
      @element:open="$emit('element:open', $event)"
      @toggle="$emit('toggle', element)"
    />
  </VRow>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import flatMap from 'lodash/flatMap';
import keyBy from 'lodash/keyBy';

import type {
  ContentElement,
  Relationship,
} from '../../interfaces/content-element';
import type { ContentContainer } from '../../interfaces/activity';
import Element from './ContentElement.vue';

interface Props {
  allowedTypes: Array<string>;
  selected: Array<ContentElement | Relationship>;
  contentContainers?: Array<ContentContainer>;
  selectable?: boolean;
  multiple?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  contentContainers: () => [],
  selectable: false,
  multiple: false,
});

defineEmits(['element:open', 'toggle']);

const isSelectionDisabled = computed(() => {
  return props.selectable && !props.multiple && !!props.selected.length;
});

const selectionMap = computed(() => {
  return keyBy(props.selected, 'id');
});

const processedContainers = computed(() => {
  const { contentContainers, allowedTypes } = props;
  if (!allowedTypes.length) return contentContainers;
  return contentContainers.map((container) => ({
    ...container,
    elements: container.elements.filter(({ type }) =>
      props.allowedTypes.includes(type),
    ),
  }));
});

const elements = computed(() => {
  return flatMap(processedContainers.value, (it) => it.elements);
});
</script>