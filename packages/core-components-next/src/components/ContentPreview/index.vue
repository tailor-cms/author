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
    <ContentElementWrapper
      v-for="el in container.elements"
      :key="el.id"
      :element="el"
      :is-selected="!!selectionMap[el.id]"
      :selectable="selectable"
      :selection-disabled="isSelectionDisabled"
      is-disabled
      @element:open="$emit('element:open', $event)"
      @toggle="$emit('toggle', el)"
    />
  </VRow>
</template>

<script lang="ts" setup>
import type {
  ContentElement,
  Relationship,
} from '@tailor-cms/interfaces/content-element';
import { computed } from 'vue';
import type { ContentContainer } from '@tailor-cms/interfaces/activity';
import type { Filter } from '@tailor-cms/interfaces/schema';
import flatMap from 'lodash/flatMap';
import keyBy from 'lodash/keyBy';

import ContentElementWrapper from './ContentElement.vue';

interface Props {
  element: ContentElement;
  allowedTypes: string[];
  selected: (ContentElement | Relationship)[];
  contentContainers?: ContentContainer[];
  filters?: Filter[];
  selectable?: boolean;
  multiple?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  contentContainers: () => [],
  filters: () => [],
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
  const { contentContainers, allowedTypes, filters } = props;
  if (!allowedTypes.length) return contentContainers;
  return contentContainers.map((container) => ({
    ...container,
    elements: container.elements.filter((element) => {
      const { type } = element;
      const isAllowedType = !allowedTypes.length || allowedTypes.includes(type);
      if (!isAllowedType) return false;
      if (!filters?.length) return true;
      return filters.every((filter) => filter(element, props.element));
    }),
  }));
});

const elements = computed(() => {
  return flatMap(processedContainers.value, (it) => it.elements);
});
</script>
