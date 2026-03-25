<template>
  <div class="px-4 pb-2">
    <div
      v-if="isAiEnabled && !isDisabled && !isAiGeneratingContent"
      class="d-flex flex-wrap justify-end mb-3 ga-3"
    >
      <AIPrompt
        :content-elements="containerContent"
        :inputs="aiInputs"
        @generate="generateContent"
      />
      <VBtn
        color="teal-darken-2"
        size="small"
        variant="tonal"
        @click="
          generateContent({
            type: AiRequestType.Create,
            text: 'Generate content for this section.',
            responseSchema: AiResponseSchema.Html,
            useImageGenerationTool: false,
          })
        "
      >
        Do the magic
        <VIcon end>mdi-magic-staff</VIcon>
      </VBtn>
    </div>
    <VSheet
      v-if="isAiGeneratingContent"
      class="bg-primary-darken-4 mb-4 pt-8 pb-8 text-subtitle-2 rounded-lg"
    >
      <CircularProgress />
      <div class="pt-3 text-primary-lighten-4 font-weight-bold">
        <span>Content generation in progress...</span>
      </div>
    </VSheet>
    <VAlert
      v-else-if="!containerContent.length"
      class="mt-7 mr-2 mb-11"
      color="primary-darken-2"
      icon="mdi-information-outline"
      variant="tonal"
      prominent
    >
      {{ isDisabled ? `Empty ${label}` : `Click the button below to add ${label}.` }}
    </VAlert>
    <ElementList
      v-if="!isAiGeneratingContent"
      :activity="container"
      :elements="containerContent"
      :is-disabled="isDisabled"
      :layout="layout"
      :supported-element-config="supportedElementConfig"
      class="element-list"
      @update="reorder"
    >
      <template #default="{ element, position, isDragged }">
        <InlineActivator
          :disabled="isDisabled"
          @click="showElementDrawer(position)"
        />
        <ContainedContent
          v-bind="{
            element,
            references: references?.[element.uid],
            isDragged,
            isDisabled,
            setWidth: false,
          }"
          show-discussion
          @delete="emit('delete:element', element)"
          @save="saveElement(element, 'data', $event)"
          @save:meta="saveElement(element, 'meta', $event)"
        />
      </template>
      <template #list-add="{ position: lastPosition, ...slotProps }">
        <AddElement
          v-bind="slotProps"
          :items="containerContent"
          :position="Math.min(insertElementPosition, lastPosition)"
          :show="!isDisabled && isAddDrawerVisible"
          class="my-5"
          color="primary-darken-3"
          label="Add content element"
          variant="tonal"
          large
          @add="addElements"
          @hidden="onHiddenElementDrawer"
        />
      </template>
    </ElementList>
  </div>
</template>

<script lang="ts" setup>
import {
  AddElement,
  AiPrompt as AIPrompt,
  CircularProgress,
  ContainedContent,
  ElementList,
  InlineActivator,
} from '@tailor-cms/core-components';
import { AiRequestType, AiResponseSchema } from '@tailor-cms/interfaces/ai';
import { computed, inject, ref } from 'vue';
import { filter, sortBy, transform } from 'lodash-es';

import type { Activity } from '@tailor-cms/interfaces/activity';
import type { AiInput } from '@tailor-cms/interfaces/ai';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';

const props = defineProps<{
  container: Activity;
  elements: Record<string, ContentElement>;
  label: string;
  isDisabled: boolean;
  layout?: boolean;
  disableAi?: boolean;
  supportedTypes?: any[];
  supportedElementConfig?: any[];
}>();

const emit = defineEmits(['save:element', 'delete:element', 'reorder:element']);

const doTheMagic = inject<any>('$doTheMagic');
const isAiEnabled = computed(() => !props.disableAi && !!doTheMagic);
const isAiGeneratingContent = ref(false);
const aiInputs = ref<AiInput[]>([]);

const generateContent = async (input: AiInput) => {
  isAiGeneratingContent.value = true;
  aiInputs.value.push(input);
  const elements = await doTheMagic({
    containerType: props.container.type,
    inputs: aiInputs.value,
    content: JSON.stringify(containerContent.value),
  });
  const lastElementPosition =
    containerContent.value?.length > 0
      ? containerContent.value[containerContent.value.length - 1].position
      : 0;
  if (input.type === AiRequestType.Modify) {
    containerContent.value.forEach((element: ContentElement) => {
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

const isAddDrawerVisible = ref(false);
const insertElementPosition = ref(Infinity);

const containerContent = computed(() => {
  const containerId = props.container.id;
  const elements = filter(props.elements, { activityId: containerId });
  return sortBy(elements, 'position');
});

const reorder = ({
  items,
  newPosition,
}: {
  items: any;
  newPosition: number;
}) => {
  const data = { items, newPosition };
  return emit('reorder:element', data);
};

const showElementDrawer = (position: number) => {
  insertElementPosition.value = position;
  isAddDrawerVisible.value = true;
};

const onHiddenElementDrawer = () => {
  isAddDrawerVisible.value = false;
  insertElementPosition.value = Infinity;
};

const addElements = async (elements: any) => {
  emit('save:element', elements);
};

const saveElement = (element: any, key: string, data: any) => {
  emit('save:element', { ...element, [key]: data });
};

const references = computed(() => {
  return transform(
    props.elements,
    (acc, { refs }, uid) => {
      acc[uid] = getRefElements(refs);
    },
    {},
  );
});

const getRefElements = (refs: any) => {
  return transform(
    refs,
    (acc, ref, key) => {
      acc[key] = ref.map(({ uid }) => props.elements[uid]);
    },
    {},
  );
};
</script>

<style lang="scss" scoped>
.element-list {
  margin: 0;
  padding: 0;
}

.element-list :deep(.contained-content) {
  margin: 0;
}

.element-list .sortable-drag {
  margin: 0;
  padding: 0;
}
</style>
