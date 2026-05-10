<template>
  <RichTextEditor
    :model-value="meta.value"
    :readonly="readonly"
    v-bind="meta"
    variant="outlined"
    class="my-2"
    @change="$emit('update', meta.key, $event)"
  />
</template>

<script lang="ts" setup>
import type { Metadata } from '@tailor-cms/interfaces/schema';
import { RichTextEditor } from '@tailor-cms/core-components';

interface Meta extends Metadata {
  value?: string;
}

interface Props {
  meta: Meta;
  dark?: boolean;
  readonly?: boolean;
}
withDefaults(defineProps<Props>(), { dark: false, readonly: false });
defineEmits(['update']);
</script>
