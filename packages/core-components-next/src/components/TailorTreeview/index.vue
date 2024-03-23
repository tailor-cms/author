<template>
  <VList v-model:opened="expanded">
    <ItemGroup
      v-for="item in items"
      :key="item.id"
      :item="item"
      @edit="emit('edit', $event)"
    />
  </VList>
</template>

<script setup lang="ts">
import { defineProps, ref } from 'vue';

import ItemGroup from './ItemGroup.vue';

defineProps<{
  items: any[];
}>();

const emit = defineEmits(['edit']);

const expanded = ref<number[]>([]);
</script>
