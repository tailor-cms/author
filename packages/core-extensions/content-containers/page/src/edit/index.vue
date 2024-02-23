<template>
  <VSheet class="content-container mb-5" elevation="3" rounded="lg">
    <div class="d-flex justify-end ma-3">
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
      v-if="!containerElements.length"
      class="mt-7 mb-5 mx-4"
      color="primary-darken-2"
      density="comfortable"
      icon="mdi-information-outline"
      variant="outlined"
      prominent
    >
      Click the button below to add content.
    </VAlert>
    <ElementList
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
import { computed, defineProps, ref } from 'vue';
import {
  ContainedContent,
  ElementList,
  InlineActivator,
} from '@tailor-cms/core-components-next';
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
  console.log('aaa', addElementComponent);
  if (props.isDisabled) return;
  console.log('eo me brate');
  insertPosition.value = position;
  isElementDrawerVisible.value = true;
  addElementComponent.value.click();
};

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
