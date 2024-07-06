<template>
  <FileInput v-bind="options" @delete="handleDelete" @upload="handleUpload" />
</template>

<script lang="ts" setup>
import { computed, defineProps } from 'vue';
import { FileInput } from '@tailor-cms/core-components-next';
import get from 'lodash/get';
import type { Metadata } from '@tailor-cms/interfaces/schema';

interface Meta extends Metadata {
  value?: { key: string; name: string };
}

const props = defineProps<{ meta: Meta }>();
const emit = defineEmits(['update']);

const handleUpload = (event: Event) => emit('update', props.meta.key, event);
const handleDelete = () => emit('update', props.meta.key, null);

const options = computed(() => {
  return {
    id: props.meta.key,
    fileKey: get(props.meta.value, 'key', ''),
    fileName: get(props.meta.value, 'name', ''),
    validate: props.meta.validate,
    label: props.meta.label,
    placeholder: props.meta.placeholder || '',
  };
});
</script>
