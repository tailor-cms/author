<template>
  <component
    :is="componentName"
    :class="{ required: get(meta, 'validate.required') }"
    :dark="dark"
    :error-messages="errorMessage"
    :meta="meta"
    @update="updateMeta"
  />
</template>

<script lang="ts" setup>
import get from 'lodash/get';
import { getMetaName } from '@tailor-cms/utils';
import type { Metadata } from '@tailor-cms/interfaces/schema';
import { useField } from 'vee-validate';

interface Props {
  meta: Metadata;
  name?: string | null;
  dark?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  name: null,
  dark: false,
});

const emit = defineEmits(['update']);

const type = computed(() => props.meta.type.toUpperCase());
const componentName = computed(() => getMetaName(type.value));

const {
  value: input,
  errorMessage,
  validate,
} = useField(() => props.name || props.meta.key, props.meta.validate, {
  label: props.meta.key,
  initialValue: props.meta.value,
});

const updateMeta = async (key: string, val: any) => {
  input.value = val;
  debugger;
  const { valid } = await validate();
  if (valid) emit('update', key, val);
};
</script>

<style lang="scss" scoped>
:deep(.title) {
  color: #808080;
  font-size: 0.875rem !important;
  font-weight: normal;
}
</style>
