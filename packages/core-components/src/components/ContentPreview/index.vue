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
  <VRow v-for="container in contentContainers" :key="container.id">
    <ContentElementWrapper
      v-for="it in container.elements"
      :key="it.id"
      :element="it"
      :is-selected="!!selectionMap[it.id]"
      :selectable="selectable"
      :selection-disabled="isSelectionDisabled"
      is-disabled
      @element:open="$emit('element:open', $event)"
      @toggle="$emit('toggle', it)"
    />
  </VRow>
</template>

<script lang="ts" setup>
import type {
  ContentElement,
  Relationship,
} from '@tailor-cms/interfaces/content-element';
import { computed } from 'vue';
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { Filter } from '@tailor-cms/interfaces/schema';
import { flatMap, keyBy } from 'lodash-es';

import ContentElementWrapper from './ContentElement.vue';

interface Props {
  selected: (ContentElement | Relationship)[];
  contentContainers?: Activity[];
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

const selectionMap = computed(() => keyBy(props.selected, 'id'));
const elements = computed(() => flatMap(props.contentContainers, 'elements'));
</script>
