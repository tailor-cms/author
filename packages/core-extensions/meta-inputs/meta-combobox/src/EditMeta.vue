<template>
  <VCombobox
    v-model="input"
    :chips="meta.multiple"
    :items="meta.options"
    :label="meta.label"
    :multiple="meta.multiple"
    :name="meta.key"
    :placeholder="meta.placeholder"
    item-text="label"
    item-value="value"
    variant="outlined"
    deletable-chips
    @change="$emit('update', meta.key, input)"
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

// const value = computed(() => {
//   const { meta: { value, options } } = this;
//   const hasPrimitiveOptions = !isObject(options[0]);
//   if (hasPrimitiveOptions) return value;
//   return value.map(val => options.find(it => it.value === val));
// }
</script>
