<template>
  <VSheet
    :key="id"
    class="element-toolbar-wrapper bg-primary-darken-4 elevation-3 h-100"
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
    <DefaultToolbar v-else :label="config.name" />
    <slot name="embed-toolbar"></slot>
    <div class="actions-container">
      <slot name="actions"></slot>
    </div>
  </VSheet>
</template>

<script lang="ts" setup>
import * as utils from '@tailor-cms/utils';

import DefaultToolbar from './DefaultToolbar.vue';

const props = defineProps({
  element: { type: Object, required: true },
  embed: { type: Object, default: null },
});

const { $ceRegistry } = useNuxtApp() as any;

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

const componentExists = computed(() => !!$ceRegistry.get(props.element.type));
const save = () => null; // store.dispatch('repository/contentElements/save');
</script>

<style lang="scss" scoped>
.element-toolbar-wrapper {
  position: absolute;
  width: 100%;
  min-height: 3.5rem;
  padding-right: 2.75rem;
  z-index: 99;

  .actions-container {
    position: absolute;
    right: 1.25rem;
    bottom: 1rem;
  }
}
</style>
