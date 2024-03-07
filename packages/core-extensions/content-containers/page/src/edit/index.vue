<template>
  <VSheet
    :color="isAiGeneratingContent ? 'primary-darken-4' : 'white'"
    class="content-container mb-5"
    elevation="3"
    rounded="lg"
  >
    <div v-if="!isAiGeneratingContent" class="d-flex justify-end ma-3">
      <VBtn
        v-if="isAiEnabled"
        class="mr-3"
        color="teal-darken-1"
        size="small"
        variant="tonal"
        @click="generateContent"
      >
        Do the magic
        <VIcon class="pl-2" right>mdi-magic-staff</VIcon>
      </VBtn>
      <VBtn
        v-if="!isDisabled"
        color="secondary"
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
      v-else
      :activity="container"
      :add-element-options="{
        large: true,
        label: 'Add content',
        icon: 'mdi-plus',
        color: 'primary-lighten-5',
        variant: 'elevated',
      }"
      :elements="containerElements"
      :is-disabled="isDisabled"
      :layout="layout"
      :supported-types="types"
      class="element-list"
      @add="emit('save:element', $event)"
      @update="reorder"
    >
      <template #default="{ element, position, isDragged }">
        <InlineActivator
          :disabled="isDisabled"
          @mousedown="showElementDrawer(position)"
        />
        <ContainedContent
          v-bind="{
            element,
            isDragged,
            isDisabled: isDisabled,
            setWidth: false,
          }"
          show-discussion
          @delete="emit('delete:element', element)"
          @save="saveElement(element, 'data', $event)"
          @save:meta="saveElement(element, 'meta', $event)"
        />
      </template>
    </ElementList>
  </VSheet>
</template>

<script lang="ts" setup>
import {
  CircularProgress,
  ContainedContent,
  ElementList,
  InlineActivator,
} from '@tailor-cms/core-components-next';
import { computed, defineProps, inject, ref } from 'vue';
import filter from 'lodash/filter';
import sortBy from 'lodash/sortBy';

const props = defineProps({
  name: { type: String, required: true },
  container: { type: Object, required: true },
  elements: { type: Object, required: true },
  types: { type: Array, default: null },
  layout: { type: Boolean, default: true },
  isDisabled: { type: Boolean, default: false },
});

const emit = defineEmits([
  'delete',
  'delete:element',
  'reorder:element',
  'save:element',
]);

const doTheMagic = inject('$doTheMagic') as any;
const isAiEnabled = computed(() => !!doTheMagic);
const isAiGeneratingContent = ref(false);

const generateContent = async () => {
  isAiGeneratingContent.value = true;
  const elements = await doTheMagic({ type: props.container.type });
  elements.forEach((element: any, index: number) => {
    emit('save:element', {
      ...element,
      position: index,
      activityId: props.container.id,
      repositoryId: props.container.repositoryId,
    });
  });
  isAiGeneratingContent.value = false;
};

const insertPosition = ref(Infinity);
const isElementDrawerVisible = ref(false);
const addElementComponent = ref();

const id = computed(() => props.container.id);
const containerElements = computed(() => {
  return sortBy(filter(props.elements, { activityId: id.value }), 'position');
});

const reorder = ({ newPosition }) => {
  emit('reorder:element', { items: containerElements.value, newPosition });
};

const showElementDrawer = (position) => {
  if (props.isDisabled) return;
  insertPosition.value = position;
  isElementDrawerVisible.value = true;
  addElementComponent.value.click();
};

// TODO: Missing implementation
// eslint-disable-next-line no-unused-vars
const onHiddenElementDrawer = () => {
  isElementDrawerVisible.value = false;
  insertPosition.value = Infinity;
};

const saveElement = (element, key, data) => {
  emit('save:element', {
    ...element,
    [key]: data,
  });
};
</script>

<style lang="scss" scoped>
.element-list ::v-deep .contained-content {
  margin: 0;
}

.element-list .sortable-drag {
  margin: 0.625rem 0;
  padding: 0;

  ::v-deep .inline-activator {
    display: none;
  }
}
</style>
