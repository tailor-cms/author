<template>
  <VTextField
    v-model="input"
    :label="meta.label"
    :name="meta.key"
    :placeholder="meta.placeholder"
    :type="meta.inputType || 'text'"
    class="mt-2 mb-4"
    variant="outlined"
    @change="onChange"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue';

interface Props {
  meta?: any;
}

const props = withDefaults(defineProps<Props>(), {
  meta: () => ({ value: null }),
});
const emit = defineEmits(['update']);

const input = ref(props.meta.value);

const onChange = () => {
  if (input.value === props.meta.value) return;
  const processedValue = props.meta.inputType === 'number'
    ? (input.value === '' ? undefined : Number(input.value))
    : input.value;
  emit('update', props.meta.key, processedValue);
};
</script>
