<template>
  <FileInput
    v-bind="options"
    class="my-2"
    :readonly="readonly"
    @upload="$emit('update', meta.key, $event)"
    @input="$emit('update', meta.key, $event)"
    @delete="$emit('update', meta.key, null)"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { FileInput } from '@tailor-cms/core-components';
import { get } from 'lodash-es';
import type { Metadata } from '@tailor-cms/interfaces/schema';

interface Meta extends Metadata {
  value?: { key: string; name: string };
}

interface Props {
  meta: Meta;
  dark?: boolean;
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  dark: false,
  readonly: false,
});
defineEmits(['update']);

const options = computed(() => {
  return {
    fileKey: get(props.meta.value, 'key', ''),
    fileName: get(props.meta.value, 'name', ''),
    allowedExtensions: props.meta.allowedExtensions,
    label: props.meta.label,
    icon: props.meta.icon,
    placeholder: props.meta.placeholder || '',
    showPreview: props.meta.showPreview,
    dark: props.dark,
    useFieldInput: true,
  };
});
</script>
