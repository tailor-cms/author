<template>
  <VTextField
    v-model="input"
    v-bind="bounds"
    :counter="isNumeric ? undefined : meta.validate?.max"
    :label="meta.label"
    :name="meta.key"
    :placeholder="meta.placeholder"
    :readonly="readonly"
    :type="meta.inputType || 'text'"
    class="my-2"
    variant="outlined"
    @change="onChange"
  />
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';

interface Props {
  meta?: any;
  dark?: boolean;
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  meta: () => ({ value: null }),
  dark: false,
  readonly: false,
});
const emit = defineEmits(['update']);

const input = ref(props.meta.value);

const isNumeric = computed(() => props.meta.inputType === 'number');

/**
 * Native bounds for number inputs, mirrored from the schema's numeric
 * validation rules. `min_value`/`max_value` are the numeric vee-validate
 * rules; plain `min`/`max` are string length rules and drive the counter.
 */
const bounds = computed(() => {
  if (!isNumeric.value) return {};
  const { min_value: min, max_value: max } = props.meta.validate ?? {};
  return { min, max };
});

const onChange = () => {
  if (input.value === props.meta.value) return;
  const processedValue = isNumeric.value
    ? (input.value === '' ? undefined : Number(input.value))
    : input.value;
  emit('update', props.meta.key, processedValue);
};
</script>
