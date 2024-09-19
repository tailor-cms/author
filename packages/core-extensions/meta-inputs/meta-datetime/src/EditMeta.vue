<template>
  <div>{{ input }}</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import type { Metadata } from '@tailor-cms/interfaces/schema';

interface Meta extends Metadata {
  value?: string;
}
const props = defineProps<{ meta: Meta; dark: boolean }>();
defineEmits(['update']);

const input = ref(props.meta.value);
</script>
