<template>
  <div class="element-sidebar">
    <div class="pb-3 text-body-2 font-weight-bold text-primary-lighten-4">
      Additional settings
    </div>
    <ElementMeta :element="element" v-bind="metadata" />
    <component :is="sidebarName" :element="element" />
  </div>
</template>

<script lang="ts" setup>
import { getElementId, getSidebarName } from '@tailor-cms/utils';

import ElementMeta from './ElementMeta/index.vue';

const props = defineProps({
  element: { type: Object, required: true },
  metadata: { type: Object, default: () => ({}) },
});

const eventBus = inject('$eventBus') as any;

const elementBus = eventBus.channel(`element:${getElementId(props.element)}`);
provide('$elementBus', elementBus);

const sidebarName = getSidebarName(props.element?.type);
</script>

<style lang="scss" scoped>
.element-sidebar {
  padding: 1.75rem 0.875rem 1.5rem;

  h3 {
    margin: 0 0.25rem 1.5rem;
  }
}
</style>
