<template>
  <VList>
    <RelationshipItem
      v-for="relationship in visibleRelationships"
      v-bind="relationship"
      :key="`${element.uid}.${relationship.key}`"
      :element="element"
      :placeholder="relationship.placeholder || defaultPlaceholder"
      @open="activeRelationship = relationship"
      @save="save(relationship.key, $event)"
    />
    <SelectElement
      v-if="activeRelationship"
      :allowed-types="activeRelationship.allowedTypes"
      :element="element"
      :filters="activeRelationship.filters"
      :heading="defaultPlaceholder"
      :multiple="activeRelationship.multiple"
      :selected="activeRelationship.value"
      header-icon="mdi-transit-connection-variant"
      only-current-repo
      @close="activeRelationship = null"
      @selected="select(activeRelationship.key, $event)"
    />
  </VList>
</template>

<script lang="ts" setup>
import type {
  ContentElement,
  RelationshipType,
} from '@tailor-cms/interfaces/content-element';
import find from 'lodash/find';
import { SelectElement } from '@tailor-cms/core-components-next';

import RelationshipItem from './RelationshipType.vue';
import { useContentElementStore } from '@/stores/content-elements';
import { useEditorStore } from '@/stores/editor';

interface Props {
  element: ContentElement;
  relationships: RelationshipType[];
}

const props = withDefaults(defineProps<Props>(), {
  relationships: () => [],
});

const activeRelationship = ref<RelationshipType | null>(null);

const visibleRelationships = computed(() => {
  return props.relationships.filter((it) => !it.disableSidebarUi);
});

const contentElementStore = useContentElementStore();
const { selectedContentElement } = useEditorStore();
const editorBus = useEditorBus();

const defaultPlaceholder = computed(() => {
  return `Select element${activeRelationship.value?.multiple ? 's' : ''}`;
});

const save = async (key: string, val: any) => {
  const refs = { ...props.element.refs };
  const updatedElement = { ...props.element, refs };
  updatedElement.refs[key] = val;
  await contentElementStore.save(updatedElement);
  if (selectedContentElement) selectedContentElement.refs[key] = val;
};

const select = (key: string, elements: ContentElement[]) => {
  // Add linked elements to the store
  elements.forEach((it) => contentElementStore.add(it));
  const items = elements.map((it) => {
    if (!it.activity) return it;
    const { id, activity, activityId: containerId } = it;
    return { id, containerId, outlineId: activity.id };
  });
  save(key, items);
};

editorBus.on('element:link', (key: string) => {
  const relationship = find(props.relationships, { key }) ?? null;
  activeRelationship.value = relationship;
});
</script>
