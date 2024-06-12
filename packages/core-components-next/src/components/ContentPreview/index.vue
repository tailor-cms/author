<template>
  <VAlert
    v-if="!elements.length"
    class="text-center"
    color="primary"
    height="19rem"
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
import keyBy from 'lodash/keyBy';

import type { ContentContainer } from '../../interfaces/activity';
import type { ContentElement } from '../../interfaces/content-element';
import Element from './ContentElement.vue';

interface Props {
  allowedTypes: Array<string>;
  selected: Array<ContentElement>;
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
  const { contentContainers: containers, allowedTypes } = props;
  if (!allowedTypes.length) return containers;
  return containers.map((container) => ({
    ...container,
    elements: container.elements?.filter((it) =>
      props.allowedTypes.includes(it.type),
    ),
  }));
});

const elements = computed(() => {
  const { value: containers } = processedContainers;
  return containers.reduce(
    (acc, it) => acc.concat(it.elements),
    [] as ContentElement[],
  );
});
</script>
