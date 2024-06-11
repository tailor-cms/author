<template>
  <VList>
    <RelationshipType
      v-for="relationship in relationships"
      v-bind="relationship"
      :key="`${element.uid}.${relationship.key}`"
      @save="save(relationship.key, $event)"
    />
  </VList>
</template>

<script lang="ts" setup>
import { defineProps } from 'vue';

import type { ContentElement } from '@/api/interfaces/content-element';
import RelationshipType from './Item.vue';
import { useContentElementStore } from '@/stores/content-elements';

const contentElementStore = useContentElementStore();

interface Props {
  element: ContentElement;
  relationships: Array<any>;
};

const props = withDefaults(defineProps<Props>(), {
  relationships: () => [],
});

const save = (key: string, val: any) => {
  const refs = { ...props.element.refs };
  const updatedElement = { ...props.element, refs };
  updatedElement.refs[key] = val;
  return contentElementStore.save(updatedElement);
};
</script>
