<template>
  <div class="px-4 pb-2">
    <VAlert
      v-if="!containerContent.length"
      class="mt-7 mr-2 mb-11"
      color="primary-darken-2"
      icon="mdi-information-outline"
      variant="tonal"
      prominent
    >
      Click the button below to add {{ label }}.
    </VAlert>
    <ElementList
      :activity="container"
      :elements="containerContent"
      :is-disabled="isDisabled"
      :layout="layout"
      :supported-types="supportedTypes"
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
          :categories="categories"
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
  ContainedContent,
  ElementList,
  InlineActivator,
} from '@tailor-cms/core-components';
import { computed, ref } from 'vue';
import { filter, sortBy, transform } from 'lodash';

import type { Activity } from '@tailor-cms/interfaces/activity';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import type { ElementCategory } from '@tailor-cms/interfaces/schema';

const props = defineProps<{
  container: Activity;
  elements: Record<string, ContentElement>;
  label: string;
  isDisabled: boolean;
  layout?: boolean;
  supportedTypes?: any[];
  categories?: ElementCategory[];
}>();

const emit = defineEmits(['save:element', 'delete:element', 'reorder:element']);

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
