<template>
  <div :key="getElementId(element)" elevation="6">
    <ElementToolbar
      v-if="element.parent"
      :element="element.parent"
      :embed="element"
    >
      <template #embed-toolbar>
        <ElementToolbar :element="element" />
      </template>
    </ElementToolbar>
    <ElementToolbar v-else :element="element" />
  </div>
</template>

<script lang="ts" setup>
import { getElementId } from '@tailor-cms/utils';

import ElementToolbar from './ElementToolbar.vue';

const props = defineProps({
  element: { type: Object, required: true },
  embed: { type: Object, default: null },
});

const elementBus = useContentElementBus(props.element);
provide('$elementBus', elementBus);
</script>
