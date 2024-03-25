<template>
  <div class="element-metadata">
    <ElementInputs
      v-if="inputs.length"
      :element="props.element"
      :inputs="props.inputs"
    />
    <!-- TODO: Needs to be implemented once element selection is implemented
    <ElementRelationships
      v-if="props.relationships.length && props.element.activityId"
      :element="props.element"
      :relationships="props.relationships"
    />-->
  </div>
</template>

<script lang="ts" setup>
import ElementInputs from './MetaInputs.vue';
// import ElementRelationships from './Relationships/index.vue';

const props = defineProps({
  element: { type: Object, required: true },
  inputs: { type: Array, default: () => [] },
  relationships: { type: Array, default: () => [] },
});
</script>
