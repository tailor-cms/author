<template>
  <div class="content-preview">
    <VAlert
      v-if="!elements.length"
      class="mx-4"
      color="grey darken-4"
      variant="text"
    >
      No available elements.
    </VAlert>
    <div
      v-for="container in processedContainers"
      :key="container.id"
      class="content-container d-flex flex-wrap"
    >
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
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import keyBy from 'lodash/keyBy';

import type { ContentContainer } from '../../interfaces/activity';
import type { ContentElement } from '../../interfaces/content-element';
import Element from './Element.vue';

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

<style lang="scss" scoped>
.content-preview {
  .v-alert {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 19rem;
  }

  .content-container:last-child {
    margin-bottom: 0.625rem;
  }
}
</style>
