<template>
  <VSheet
    :color="isAiGeneratingContent ? 'primary-darken-4' : 'white'"
    class="content-container mb-5 pr-4"
    elevation="3"
    rounded="lg"
  >
    <div v-if="!isAiGeneratingContent" class="d-flex justify-end ma-3">
      <AIPrompt
        v-if="isAiEnabled && !disabled"
        :content-elements="containerElements"
        :inputs="aiInputs"
        @generate="generateContent"
      />
      <VBtn
        v-if="isAiEnabled && !disabled"
        class="mx-3"
        color="teal-darken-2"
        size="small"
        variant="tonal"
        @click="
          generateContent({
            type: AiRequestType.Create,
            text: 'Generate content for this page.',
            responseSchema: AiResponseSchema.Html,
            useImageGenerationTool: true,
          })
        "
      >
        Do the magic
        <VIcon end>mdi-magic-staff</VIcon>
      </VBtn>
      <VBtn
        v-if="!disabled"
        color="secondary-darken-1"
        size="small"
        variant="tonal"
        @click="emit('delete')"
      >
        Delete {{ props.name }}
      </VBtn>
    </div>
    <VAlert
      v-if="!containerElements.length && !isAiGeneratingContent"
      class="mt-7 mb-5 mx-4"
      color="primary-darken-1"
      density="comfortable"
      icon="mdi-information-outline"
      variant="tonal"
      prominent
    >
      Click the button below to add content.
    </VAlert>
    <VSheet
      v-else-if="isAiGeneratingContent"
      class="bg-transparent pt-16 text-subtitle-2 rounded-lg"
    >
      <CircularProgress />
      <div class="pt-3 text-primary-lighten-4 font-weight-bold">
        <span>Content generation in progress...</span>
      </div>
    </VSheet>
    <ElementList
      v-if="!isAiGeneratingContent"
      :activity="container"
      :add-element-options="{
        show: isElementDrawerVisible,
        large: true,
        label: 'Add content',
        icon: 'mdi-plus',
        color: 'primary-lighten-5',
        position: insertPosition,
        variant: 'elevated',
      }"
      :elements="containerElements"
      :enable-add="false"
      :is-disabled="disabled"
      :layout="layout"
      :supported-types-config="contentElementConfig"
      class="element-list"
      @add="onElementAdd"
      @update="reorder"
    >
      <template #default="{ element, position: pos, isDragged }">
        <InlineActivator
          :disabled="disabled"
          @mousedown="showElementDrawer(pos)"
        />
        <ContainedContent
          v-bind="{
            embedElementConfig,
            element,
            isDragged,
            isDisabled: disabled,
            setWidth: false,
          }"
          :references="getRefElements(element.refs)"
          show-discussion
          @delete="emit('delete:element', element)"
          @save="saveElement(element, 'data', $event)"
          @save:meta="saveElement(element, 'meta', $event)"
        />
      </template>
    </ElementList>
    <AddElement
      v-if="!disabled && !isAiGeneratingContent"
      :activity="container"
      :include="contentElementConfig"
      :items="containerElements"
      :large="true"
      :layout="layout"
      :position="insertPosition ?? containerElements.length"
      :show="isElementDrawerVisible"
      class="my-4"
      color="primary-lighten-5"
      icon="mdi-plus"
      label="Add content"
      variant="elevated"
      @add="onElementAdd"
      @hidden="onElementDrawerClose"
    />
  </VSheet>
</template>

<script lang="ts" setup>
import type {
  ContentElement,
  Relationship,
} from '@tailor-cms/interfaces/content-element';
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { AiInput } from '@tailor-cms/interfaces/ai';
import type { ContentElementCategory } from '@tailor-cms/interfaces/schema';
import {
  AddElement,
  CircularProgress,
  ContainedContent,
  ElementList,
  InlineActivator,
} from '@tailor-cms/core-components';
import { AiRequestType, AiResponseSchema } from '@tailor-cms/interfaces/ai';
import { filter, reduce, sortBy } from 'lodash-es';
import { computed, inject, ref } from 'vue';

import AIPrompt from './AIPrompt.vue';

interface Props {
  name: string;
  container: Activity;
  elements: Record<string, ContentElement>;
  position: number;
  embedElementConfig?: ContentElementCategory[];
  contentElementConfig?: ContentElementCategory[];
  layout?: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  embedElementConfig: () => [],
  contentElementConfig: () => [],
  layout: true,
  disabled: false,
});

const emit = defineEmits([
  'delete',
  'delete:element',
  'reorder:element',
  'save:element',
]);

const doTheMagic = inject<any>('$doTheMagic');
const isAiEnabled = computed(() => !!doTheMagic);
const isAiGeneratingContent = ref(false);
const aiInputs = ref<AiInput[]>([]);

const generateContent = async (input: AiInput) => {
  isAiGeneratingContent.value = true;
  aiInputs.value.push(input);
  const elements = await doTheMagic({
    containerType: props.container.type,
    inputs: aiInputs.value,
    content: JSON.stringify(containerElements.value),
  });
  const lastElementPosition =
    containerElements.value?.length > 0
      ? containerElements.value[containerElements.value.length - 1].position
      : 0;
  if (input.type === AiRequestType.Modify) {
    containerElements.value.forEach((element: ContentElement) => {
      emit('delete:element', element, true);
    });
  }
  elements.forEach((element: ContentElement, index: number) => {
    emit('save:element', {
      ...element,
      position: lastElementPosition + index + 1,
      activityId: props.container.id,
      repositoryId: props.container.repositoryId,
    });
  });
  isAiGeneratingContent.value = false;
};

const id = computed(() => props.container.id);
const containerElements = computed(() => {
  return sortBy(filter(props.elements, { activityId: id.value }), 'position');
});

const insertPosition = ref<number | null>(null);
const isElementDrawerVisible = ref(false);

const reorder = ({ newPosition }: { newPosition: number }) => {
  emit('reorder:element', { items: containerElements.value, newPosition });
};

const showElementDrawer = (elementIndex: number) => {
  if (props.disabled) return;
  insertPosition.value = elementIndex;
  isElementDrawerVisible.value = true;
};

const onElementDrawerClose = () => {
  isElementDrawerVisible.value = false;
  insertPosition.value = null;
};

const onElementAdd = (element: ContentElement) => {
  emit('save:element', element);
  isElementDrawerVisible.value = false;
  insertPosition.value = null;
};

const saveElement = (element: ContentElement, key: string, data: any) => {
  emit('save:element', {
    ...element,
    [key]: data,
  });
};

const getRefElements = (refs: Record<string, Relationship[]>) => {
  return reduce(
    refs,
    (acc: any, it, key: string) => {
      const elements = it.map(({ uid }) => props.elements[uid]);
      acc[key] = elements.filter(Boolean) as ContentElement[];
      return acc;
    },
    {} as Record<string, ContentElement[]>,
  );
};
</script>

<style lang="scss" scoped>
.element-list :deep(.contained-content) {
  margin: 0;
}

.element-list .sortable-drag {
  margin: 0.625rem 0;
  padding: 0;

  :deep(.inline-activator) {
    display: none;
  }
}
</style>
