<template>
  <VSheet
    :color="isAiGeneratingContent ? 'primary-darken-4' : 'white'"
    class="content-container mb-5 pr-4"
    elevation="3"
    rounded="lg"
  >
    <div v-if="!isAiGeneratingContent" class="d-flex justify-end ma-3">
      <VBtn
        v-if="isAiEnabled && !disabled"
        class="mr-3"
        color="teal-darken-2"
        size="small"
        variant="tonal"
        @click="generateContent"
      >
        Do the magic
        <VIcon class="pl-2" right>mdi-magic-staff</VIcon>
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
      :supported-types="types"
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
      :categories="categories"
      :include="types"
      :items="containerElements"
      :large="true"
      :layout="layout"
      :position="insertPosition ? insertPosition : containerElements.length"
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
import {
  AddElement,
  CircularProgress,
  ContainedContent,
  ElementList,
  InlineActivator,
} from '@tailor-cms/core-components';
import { computed, inject, ref } from 'vue';
import type {
  ContentElement,
  Relationship,
} from '@tailor-cms/interfaces/content-element';
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { ElementCategory } from '@tailor-cms/interfaces/schema';
import filter from 'lodash/filter';
import reduce from 'lodash/reduce';
import sortBy from 'lodash/sortBy';

interface Props {
  name: string;
  container: Activity;
  elements: Record<string, ContentElement>;
  position: number;
  types?: string[] | null;
  categories?: ElementCategory[] | null;
  layout?: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  types: null,
  layout: true,
  disabled: false,
  categories: null,
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

const generateContent = async () => {
  isAiGeneratingContent.value = true;
  const elements = await doTheMagic({ type: props.container.type });
  elements.forEach((element: ContentElement, index: number) => {
    emit('save:element', {
      ...element,
      position: index,
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

const insertPosition = ref(0);
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
  insertPosition.value = 0;
};

const onElementAdd = (element: ContentElement) => {
  emit('save:element', element);
  isElementDrawerVisible.value = false;
  insertPosition.value = 0;
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
