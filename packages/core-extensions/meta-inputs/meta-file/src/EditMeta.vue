<template>
  <FileInput
    v-bind="options"
    @delete="$emit('update', meta.key, null)"
    @upload="$emit('update', meta.key, $event)"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { FileInput } from '@tailor-cms/core-components-next';
import get from 'lodash/get';
import type { Metadata } from '@tailor-cms/interfaces/schema';

interface Meta extends Metadata {
  value?: { key: string; name: string };
}

interface Props {
  meta: Meta;
  dark?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  dark: false,
});

defineEmits(['update']);

const options = computed(() => {
  return {
    id: props.meta.key,
    fileKey: get(props.meta.value, 'key', ''),
    fileName: get(props.meta.value, 'name', ''),
    validate: props.meta.validate,
    label: props.meta.label,
    icon: props.meta.icon,
    value: props.meta.value,
    placeholder: props.meta.placeholder || '',
    previewImage: props.meta.previewImage,
    dark: props.dark,
  };
});
</script>
