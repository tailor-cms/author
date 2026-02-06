<template>
  <RichTextEditor
    :model-value="meta.value"
    v-bind="meta"
    variant="outlined"
    class="my-2"
    @change="$emit('update', props.meta.key, $event)"
  />
</template>

<script lang="ts" setup>
import type { Metadata } from '@tailor-cms/interfaces/schema';
import { RichTextEditor } from '@tailor-cms/core-components';

interface Meta extends Metadata {
  value?: string;
}

const props = defineProps<{ meta: Meta }>();
defineEmits(['update']);
</script>
