<template>
  <VList>
    <RelationshipItem
      v-for="relationship in relationships"
      v-bind="relationship"
      :key="`${element.uid}.${relationship.key}`"
      @save="save(relationship.key, $event)"
    />
  </VList>
</template>

<script lang="ts" setup>
import { defineProps } from 'vue';

import type {
  ContentElement,
  Relationship,
  RelationshipType,
} from '@/api/interfaces/content-element';
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

const contentElementStore = useContentElementStore();
const { selectedContentElement } = useEditorStore();

const save = async (key: string, val: Relationship) => {
  const refs = { ...props.element.refs };
  const updatedElement = { ...props.element, refs };
  updatedElement.refs[key] = val;
  await contentElementStore.save(updatedElement);
  if (selectedContentElement) selectedContentElement.refs[key] = val;
};
</script>
