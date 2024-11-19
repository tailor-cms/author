<template>
  <VCombobox
    v-model="input"
    :chips="meta.multiple"
    :items="meta.options"
    :label="meta.label"
    :multiple="meta.multiple"
    :name="meta.key"
    :placeholder="meta.placeholder"
    class="my-2"
    item-title="label"
    item-value="value"
    variant="outlined"
    closable-chips
    @update:model-value="$emit('update', meta.key, input)"
  />
</template>

<script lang="ts" setup>
import type { Metadata } from '@tailor-cms/interfaces/schema';
import { ref } from 'vue';

interface Meta extends Metadata {
  value?: string;
}
const props = defineProps<{ meta: Meta; dark: boolean }>();
defineEmits(['update']);

const input = ref(props.meta.value);
</script>
