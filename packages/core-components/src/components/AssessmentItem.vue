<template>
  <div class="d-flex align-start justify-strech">
    <span v-if="!isDisabled && draggable" class="drag-handle">
      <VIcon
        icon="mdi-drag-vertical"
        class="opacity-40"
      />
    </span>
    <QuestionElement
      :icon="manifest?.ui.icon"
      :type="manifest?.name"
      v-bind="{
        componentName,
        element,
        embedElementConfig,
        isDisabled,
      }"
      :class="[element.changeSincePublish, { diff: showPublishDiff }]"
      :is-dirty="isDirty"
      class="flex-grow-1"
      collapsable
      @delete="emit('delete')"
      @save="save"
    >
      <template #default>
        <slot name="header"></slot>
      </template>
    </QuestionElement>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue';
import { cloneDeep } from 'lodash-es';
import type {
  ContentElementCategory,
  ElementRegistry,
} from '@tailor-cms/interfaces/schema';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';

import QuestionElement from './QuestionElement.vue';

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

const editorState = inject<any>('$editorState');
const ceRegistry = inject<ElementRegistry>('$ceRegistry');

const manifest = computed(() => ceRegistry?.getByEntity(props.element));
const showPublishDiff = computed(() => editorState?.isPublishDiff.value);
const componentName = computed(() => manifest.value?.componentName);

const save = (data: ContentElement['data']) => {
  emit('save', { ...cloneDeep(props.element), data });
};
</script>

<style lang="scss" scoped>
@use '../mixins';

.drag-handle {
  cursor: pointer;
  margin: 0.75rem 0 0.625rem -0.5rem;
}

.diff {
  &.new {
    @include mixins.highlight(rgb(var(--v-theme-success-lighten-4)));
  }

  &.changed,
  &.removed {
    @include mixins.highlight(rgb(var(--v-theme-secondary-lighten-4)));
  }
}
</style>
