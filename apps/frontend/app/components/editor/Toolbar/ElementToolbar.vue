<template>
  <VSheet
    :key="id"
    class="element-toolbar-wrapper d-flex align-center justify-center"
    color="transparent"
  >
    <template v-if="componentExists">
      <component
        :is="componentName"
        :element="props.element"
        :embed="props.embed"
        @save="save"
      />
    </template>
    <DefaultToolbar v-else :label="config?.name || ''" />
    <slot name="embed-toolbar"></slot>
  </VSheet>
</template>

<script lang="ts" setup>
import * as utils from '@tailor-cms/utils';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';

import DefaultToolbar from './DefaultToolbar.vue';

const { $ceRegistry } = useNuxtApp() as any;
const elementBus = inject('$elementBus') as any;

interface Props {
  element: ContentElement;
  embed?: any;
}

const props = withDefaults(defineProps<Props>(), {
  embed: null,
});

const id = computed(() => utils.getElementId(props.element));
const componentName = computed(() => utils.getToolbarName(props.element.type));
const config = computed(() => $ceRegistry.get(props.element.type));

const componentExists = computed(
  () => !!$ceRegistry.get(props.element.type)?.hasTopToolbar,
);
const save = (data: any) => elementBus.emit('save', data);
</script>

<style lang="scss" scoped>
.element-toolbar-wrapper {
  width: 100%;
  min-height: 5.5rem;
  padding: 0.5rem 2rem;
}

:deep(.v-btn-group--density-compact.v-btn-group) {
  height: unset;
}
</style>
