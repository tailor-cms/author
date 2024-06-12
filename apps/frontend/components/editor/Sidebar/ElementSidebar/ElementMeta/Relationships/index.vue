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

import type { ContentElement, Relationship, RelationshipType } from '@/api/interfaces/content-element';
import RelationshipItem from './RelationshipType.vue';
import { useContentElementStore } from '@/stores/content-elements';

interface Props {
  element: ContentElement;
  relationships: Array<RelationshipType>;
}

const props = withDefaults(defineProps<Props>(), {
  relationships: () => [],
});

const contentElementStore = useContentElementStore();

const save = (key: string, val: Relationship) => {
  const refs = { ...props.element.refs };
  const updatedElement = { ...props.element, refs };
  updatedElement.refs[key] = val;
  return contentElementStore.save(updatedElement);
};
</script>
