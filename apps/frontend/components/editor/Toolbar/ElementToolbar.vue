<template>
  <VSheet
    :key="id"
    class="element-toolbar-wrapper d-flex align-center justify-center"
    color="#fff"
    elevation="1"
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

const componentName = computed(() => {
  const { type } = props.element;
  if (utils.isQuestion(props.element.type)) return;
  return utils.getToolbarName(type);
});

const id = utils.getElementId(props.element);

const isQuestion = computed(() => utils.isQuestion(props.element.type));

const config = computed(() => {
  const { element } = props;
  const type = isQuestion.value ? element.data.type : element.type;
  return $ceRegistry.get(type);
});

const componentExists = computed(
  () => !!$ceRegistry.get(props.element.type)?.hasTopToolbar,
);
const save = (data: any) => elementBus.emit('save', data);
</script>

<style lang="scss" scoped>
.element-toolbar-wrapper {
  position: absolute;
  width: 100%;
  min-height: 5.5rem;
  padding: 0.5rem 2rem;
  z-index: 99;
  border-bottom: 4px solid #cfd8dc;
}
</style>
