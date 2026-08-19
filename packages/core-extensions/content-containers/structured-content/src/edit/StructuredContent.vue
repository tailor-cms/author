<template>
  <div class="px-4 pb-2">
    <div
      v-if="isAiEnabled && !isReadonly && !isAiGeneratingContent"
      class="d-flex flex-wrap justify-end mb-3 ga-3"
    >
      <AIPrompt
        :content-elements="containerContent"
        :inputs="aiInputs"
        @generate="generateContent"
      />
      <VBtn
        append-icon="mdi-shimmer"
        color="secondary"
        size="small"
        text="Do the magic"
        variant="tonal"
        @click="generateContent({
          type: AiRequestType.Create,
          text: 'Generate content for this section.',
          responseSchema: AiResponseSchema.Html,
        })"
      />
    </div>
    <VSheet
      v-if="isAiGeneratingContent"
      class="bg-surface-container-high mb-4 pt-8 pb-8 text-title-small"
      rounded="lg"
    >
      <CircularProgress />
      <div class="pt-3 font-weight-bold">
        <span>Content generation in progress...</span>
      </div>
    </VSheet>
    <VAlert
      v-else-if="!containerContent.length"
      :text="isReadonly ? `Empty ${label}` : `Click the button below to add ${label}.`"
      class="mt-7 mr-2 mb-11"
      icon="mdi-information-outline"
      variant="tonal"
      prominent
    />
    <ElementList
      v-if="!isAiGeneratingContent"
      :activity="container"
      :elements="containerContent"
      :is-readonly="isReadonly"
      :layout="layout"
      :supported-element-config="supportedElementConfig"
      class="element-list"
      @update="reorder"
    >
      <template #default="{ element, position, isDragged }">
        <InlineActivator
          :disabled="isReadonly"
          @click="showElementDrawer(position)"
        />
        <ContainedContent
          v-bind="{
            element,
            references: references?.[element.uid],
            isDragged,
            isReadonly,
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
          :show="!isReadonly && isAddDrawerVisible"
          class="my-5"
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
import { castArray, filter, sortBy, transform } from 'lodash-es';

import type {
  ContentElement,
  Relationship,
} from '@tailor-cms/interfaces/content-element';
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { AiInput } from '@tailor-cms/interfaces/ai';

const props = defineProps<{
  container: Activity;
  elements: Record<string, ContentElement>;
  label: string;
  isReadonly: boolean;
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
  const lastElement = containerContent.value.at(-1);
  const lastElementPosition = lastElement ? lastElement.position : 0;
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
    (acc: Record<string, Record<string, ContentElement[]>>, { refs }, uid) => {
      acc[uid] = getRefElements(refs);
    },
    {} as Record<string, Record<string, ContentElement[]>>,
  );
});

// Single-valued relationships store a bare pointer instead of a list.
const getRefElements = (refs: Record<string, Relationship[] | Relationship>) => {
  return transform(
    refs,
    (acc: Record<string, ContentElement[]>, relations, key) => {
      acc[key] = castArray(relations)
        .map(({ uid }) => (uid ? props.elements[uid] : undefined))
        .filter((it): it is ContentElement => Boolean(it));
    },
    {} as Record<string, ContentElement[]>,
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
