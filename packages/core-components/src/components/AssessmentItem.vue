<template>
  <VSheet
    v-if="loading"
    color="primary-lighten-5"
    class="py-16 text-subtitle-2 rounded-lg text-center"
  >
    <CircularProgress />
    <div class="pt-3 text-primary-darken-4 font-weight-bold">
      <span>Content generation in progress...</span>
    </div>
  </VSheet>
  <div v-else class="d-flex align-start justify-strech">
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
        expanded,
        componentName,
        element,
        embedElementConfig,
        isDisabled,
        isReadonly: props.isDisabled,
      }"
      :class="[element.changeSincePublish, { diff: showPublishDiff }]"
      :is-dirty="isDirty"
      class="flex-grow-1"
      collapsable
      @delete="emit('delete')"
      @generate="confirmGenerate"
      @reset="reset"
      @save="save"
      @selected="emit('selected')"
    >
      <template #default>
        <slot name="header"></slot>
      </template>
    </QuestionElement>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue';
import type {
  ContentElementCategory,
  ElementRegistry,
} from '@tailor-cms/interfaces/schema';
import { AiRequestType } from '@tailor-cms/interfaces/ai';
import { cloneDeep } from 'lodash-es';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';

import CircularProgress from './CircularProgress.vue';
import QuestionElement from './QuestionElement.vue';
import { useLoader } from '../composables/useLoader';

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
const doTheMagic = inject<any>('$doTheMagic');
const ceRegistry = inject<ElementRegistry>('$ceRegistry');

const { loading, loader } = useLoader();
const confirmationDialog = useConfirmationDialog();

const manifest = computed(() => ceRegistry?.getByEntity(props.element));
const showPublishDiff = computed(() => editorState?.isPublishDiff.value);
const componentName = computed(() => manifest.value?.componentName);

const reset = () => {
  if (!ceRegistry) return;
  confirmationDialog({
    title: 'Reset element?',
    message: 'Are you sure you want to reset this element?',
    action: () => {
      const data = ceRegistry.resetData(props.element);
      return save(data);
    },
  });
};

const confirmGenerate = () => {
  if (!ceRegistry) return;
  confirmationDialog({
    title: 'Generate element content?',
    message: 'Are you sure you want to generate new content for this element?',
    action: generateContent,
  });
};

const generateContent = loader(async function () {
  const data = cloneDeep(props.element.data);
  const inputs = [{
    type: AiRequestType.Create,
    text: 'Generate content element for this page.',
    responseSchema: props.element.type,
  }];
  const generatedContent = await doTheMagic({ inputs });
  return save({ ...data, ...generatedContent });
});

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
