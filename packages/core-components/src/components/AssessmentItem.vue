<template>
  <VHover v-slot="{ isHovering: isCardHovered, props: hoverProps }">
    <div
      v-bind="hoverProps"
      class="d-flex align-start justify-strech">
      <span v-if="!isDisabled && draggable" class="drag-handle">
        <VIcon
          icon="mdi-drag-vertical"
          color="primary-lighten-2"
          size="large"
        />
      </span>
      <QuestionElement
        v-if="expanded"
        :icon="elementConfig?.ui.icon"
        :type="elementConfig?.name"
        v-bind="{
          componentName,
          element,
          embedElementConfig,
          isDisabled,
        }"
        :class="[element.changeSincePublish, { diff: showPublishDiff }]"
        class="flex-grow-1"
        @delete="emit('delete')"
        @save="save"
      />
      <VCard
        v-else
        :class="[element.changeSincePublish, { diff: showPublishDiff }]"
        class="d-flex justify-space-between align-center pa-2 w-100"
        color="primary-darken-2"
        variant="flat"
        min-height="48"
        @click="$emit('selected')">
        <VRow class="w-100" dense>
          <VCol cols="3" class="text-left align-content-center">
            <div class="px-2 d-flex align-center">
              <VIcon
                :icon="elementConfig?.ui.icon"
                color="secondary-lighten-2"
                size="small"
                start
              />
              <span class="text-subtitle-1">{{ elementConfig?.name }}</span>
            </div>
          </VCol>
          <VCol
            cols="6"
            class="text-subtitle-2 align-content-center text-truncate"
          >
            {{ question }}
          </VCol>
          <VCol cols="3" class="text-right align-content-center">
            <PublishDiffChip
              v-if="editorState.isPublishDiff && element.changeSincePublish"
              :change-type="publishDiffChangeType"
            />
            <VBtn
              v-else-if="isCardHovered"
              color="secondary-lighten-3"
              class="delete"
              variant="tonal"
              size="x-small"
              icon
              @click.stop="$emit('delete')">
              <VIcon icon="mdi-delete-outline" size="large" />
            </VBtn>
          </VCol>
        </VRow>
      </VCard>
      <VBtn
        icon="mdi-chevron-down"
        variant="tonal"
        class="ml-3 my-1"
        density="comfortable"
        color="primary-lighten-2"
        @click="$emit('selected')" />
    </div>
  </VHover>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue';
import { cloneDeep, filter, map, sortBy } from 'lodash-es';
import type {
  ContentElementCategory,
  ElementRegistry,
} from '@tailor-cms/interfaces/schema';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import { getComponentName } from '@tailor-cms/utils';
import type { PublishDiffChangeTypes } from '@tailor-cms/utils';

import PublishDiffChip from './PublishDiffChip.vue';
import QuestionElement from './QuestionElement.vue';

interface Props {
  element: ContentElement;
  embedElementConfig?: ContentElementCategory[];
  expanded?: boolean;
  draggable?: boolean;
  isDisabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  embedElementConfig: () => [],
  expanded: false,
  draggable: false,
  isDisabled: false,
});

const emit = defineEmits(['add', 'save', 'delete', 'selected']);

const editorState = inject<any>('$editorState');
const ceRegistry = inject<ElementRegistry>('$ceRegistry');

const TEXT_CONTAINERS = ['TIPTAP_HTML'];
const blankRegex = /(@blank)/g;
const htmlRegex = /(<\/?[^>]+(>|$))|&nbsp;/g;

const elementConfig = computed(() => ceRegistry?.get(props.element.type));
const showPublishDiff = computed(() => editorState?.isPublishDiff.value);
const componentName = computed(() => getComponentName(props.element.type));
const publishDiffChangeType = computed(() =>
  props.element.changeSincePublish as PublishDiffChangeTypes);

const getTextAssets = (items: ContentElement[]) =>
  filter(items, (it) => TEXT_CONTAINERS.includes(it.type));

const save = (data: ContentElement['data']) => {
  emit('save', { ...cloneDeep(props.element), data });
};

const question = computed(() => {
  const embeds = props.element.data.embeds as Record<string, ContentElement>;
  const textAssets = getTextAssets(sortBy(embeds, 'position'));
  const questionText = map(textAssets, 'data.content').join(' ');
  return questionText.replace(htmlRegex, '').replace(blankRegex, () => '____');
});
</script>

<style lang="scss" scoped>
@use '../mixins';

.drag-handle {
  margin: 0.625rem 0 0.625rem -0.5rem;
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
