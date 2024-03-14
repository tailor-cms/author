<template>
  <div :key="getElementId(element)">
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

const { $eventBus } = useNuxtApp() as any;

const channelName = `element:${getElementId(props.element.id)}`;
const elementBus = $eventBus.channel(channelName);

provide('$elementBus', elementBus);
</script>
