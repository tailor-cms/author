<template>
  <div class="content-preview">
    <VAlert v-if="!elements.length" class="mx-4" color="grey darken-4" text>
      No available elements.
    </VAlert>
    <div
      v-for="container in processedContainers"
      :key="container.id"
      class="content-container d-flex flex-wrap"
    >
      <ContentElement
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
import { keyBy } from 'lodash';

import ContentElement from './Element.vue';

interface Props {
  contentContainers: Array<any>;
  selectable: boolean;
  multiple: boolean;
  allowedTypes: Array<any>;
  selected: Array<any>;
}

const props = withDefaults(defineProps<Props>(), {
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
  return containers.reduce((acc, it) => acc.concat(it.elements), []);
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
