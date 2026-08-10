<template>
  <ContentElementWrapper
    v-bind="$attrs"
    :element="element"
    :embed-element-config="embedElementConfig"
    :expanded="expanded"
    :is-dirty="isDirty"
    :is-disabled="isDisabled"
    :is-draggable="draggable"
    @add="emit('add', $event)"
    @delete="emit('delete')"
    @save="save"
    @update:expanded="emit('selected')"
  >
    <slot name="header"></slot>
  </ContentElementWrapper>
</template>

<script lang="ts" setup>
import { cloneDeep } from 'lodash-es';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import type { ContentElementCategory } from '@tailor-cms/interfaces/schema';

import ContentElementWrapper from './ContentElement/index.vue';

defineOptions({ inheritAttrs: false });

interface Props {
  element: ContentElement;
  embedElementConfig?: ContentElementCategory[];
  expanded?: boolean;
  draggable?: boolean;
  isDisabled?: boolean;
  isDirty?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  embedElementConfig: () => [],
  expanded: false,
  draggable: false,
  isDisabled: false,
  isDirty: false,
});

const emit = defineEmits(['add', 'save', 'delete', 'selected']);

const save = (data: ContentElement['data']) => {
  emit('save', { ...cloneDeep(props.element), data });
};
</script>
