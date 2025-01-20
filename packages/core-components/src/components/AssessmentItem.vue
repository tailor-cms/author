<template>
  <VHover v-slot="{ isHovering: isCardHovered, props: hoverProps }">
    <div
      v-bind="hoverProps"
      :class="[props.element.changeSincePublish, {
        hover: isCardHovered,
        expanded: props.expanded,
        diff: editorState.isPublishDiff,
      }]"
      class="d-flex align-start justify-strech">
      <component
        :is="componentName(element.type)"
        v-if="props.expanded"
        v-bind="{
          element,
          embedTypes: embedElementConfig,
          embedElementConfig,
          isDisabled,
        }"
        class="flex-grow-1"
        @delete="emit('delete')"
        @save="save"
      />
      <VCard
        v-else
        class="d-flex justify-space-between align-center pa-2 w-100"
        color="primary-darken-2"
        variant="flat"
        @click="$emit('selected')">
        <VChip variant="text">
          <VIcon
            :icon="elementConfig?.ui.icon"
            color="secondary-lighten-2"
            start
          />
          <span class="text-subtitle-1">{{ elementConfig?.name }}</span>
        </VChip>
        <span class="question mx-2">{{ question }}</span>
        <PublishDiffChip
          v-if="editorState.isPublishDiff && props.element.changeSincePublish"
          :change-type="props.element.changeSincePublish"
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
      </VCard>
      <VBtn
        icon="mdi-chevron-down"
        variant="tonal"
        class="ml-3 my-1"
        density="comfortable"
        @click="$emit('selected')" />
    </div>
  </VHover>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue';
import type {
  ContentElementCategory,
  ElementRegistry,
} from '@tailor-cms/interfaces/schema';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import { getComponentName } from '@tailor-cms/utils';
import cloneDeep from 'lodash/cloneDeep';
import filter from 'lodash/filter';
import map from 'lodash/map';
import truncate from 'lodash/truncate';

import PublishDiffChip from './PublishDiffChip.vue';

interface Props {
  embedElementConfig?: ContentElementCategory[] | null;
  element: ContentElement;
  expanded?: boolean;
  draggable?: boolean;
  isDisabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  expanded: false,
  draggable: true,
  isDisabled: false,
});

const emit = defineEmits(['add', 'save', 'delete', 'selected']);

const editorState = inject<any>('$editorState');
const ceRegistry = inject<ElementRegistry>('$ceRegistry');

const TEXT_CONTAINERS = ['CE_HTML_DEFAULT'];
const blankRegex = /(@blank)/g;
const htmlRegex = /(<\/?[^>]+(>|$))|&nbsp;/g;

const elementConfig = computed(() => ceRegistry?.get(props.element.type));

const getTextAssets = (item: any) =>
  filter(item, (it: any) => TEXT_CONTAINERS.includes(it.type));

const componentName = (type: string) => getComponentName(type);

const save = (data: any) => {
  emit('save', { ...cloneDeep(props.element), data });
};

const question = computed(() => {
  const question = props.element.data.question as string[];
  const embeds = props.element.data.embeds as Record<string, ContentElement>;
  const textAssets = getTextAssets(question?.map((id) => embeds[id]));
  const questionText = map(textAssets, 'data.content').join(' ');
  return truncate(
    questionText.replace(htmlRegex, '').replace(blankRegex, () => '____'),
    { length: 50 });
});
</script>

<style lang="scss" scoped>
@use '../mixins';

.assessment-item {
  margin-bottom: 0.625rem;
  padding: 0;
  position: relative;

  // .v-chip {
  //   min-width: 1.875rem;
  // }

  // .drag-handle {
  //   position: absolute;
  //   top: 0;
  //   left: -1.75rem;
  //   cursor: move;
  //   color: #888;
  // }

  // .minimized {
  //   padding: 0.375rem 1.375rem;
  //   cursor: pointer;

  //   .question {
  //     display: inline-block;
  //     max-width: 80%;
  //     min-height: 1.875rem;
  //     font-size: 1rem;
  //     line-height: 2.125rem;
  //     font-weight: 400;
  //     color: #444;
  //   }

  //   .v-chip {
  //     margin-top: 0.125rem;
  //   }
  // }

  // .delete {
  //   opacity: 0;
  // }

  // &.hover:not(.sortable-chosen) .delete:not(.disabled) {
  //   opacity: 1;
  // }
}

.question-container {
  margin: 0 !important;
}

.diff {
  border: none;

  &.expanded {
    border-radius: 4px;
  }

  &.new {
    @include mixins.highlight(var(--v-success-lighten2));
  }

  &.changed, &.removed {
    @include mixins.highlight(var(--v-secondary-lighten4));
  }
}
</style>
