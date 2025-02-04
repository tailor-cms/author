<template>
  <TailorEmbeddedContainer :elements="elements" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import sortBy from 'lodash/sortBy';

const props = defineProps<{
  embeds: Record<string, any>;
}>();

const elements = computed(() => sortBy(props.embeds, 'position'));
</script>
