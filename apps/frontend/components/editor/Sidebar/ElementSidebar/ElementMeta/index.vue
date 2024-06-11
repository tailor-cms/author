<template>
  <div class="element-metadata">
    <ElementInputs v-if="inputs.length" :element="element" :inputs="inputs" />
    <ElementRelationships
      v-if="relationships.length && element.activityId"
      :element="element"
      :relationships="relationships"
    />
  </div>
</template>

<script lang="ts" setup>
import type { ContentElement } from '@/api/interfaces/content-element';
import ElementInputs from './MetaInputs.vue';
import ElementRelationships from './Relationships/index.vue';

interface Props {
  element: ContentElement;
  inputs?: any[];
  relationships?: any[];
}

withDefaults(defineProps<Props>(), {
  inputs: () => [],
  relationships: () => [],
});
</script>
