<template>
  <Field
    v-slot="{ handleChange, errors }"
    :name="$props.meta.key"
    :rules="props.meta.validate"
  >
    <component
      :is="componentName"
      :class="{ required: get(meta, 'validate.required') }"
      :dark="dark"
      :error-messages="errors"
      :meta="meta"
      @update="(key: string, value: any) => update(key, value, handleChange)"
    />
  </Field>
</template>

<script lang="ts" setup>
import { Field } from 'vee-validate';
import get from 'lodash/get';
import { getMetaName } from '@tailor-cms/utils';
import type { Metadata } from '@tailor-cms/interfaces/schema';

interface Props {
  meta: Metadata;
  dark?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  dark: false,
});

const emit = defineEmits(['update']);

const type = computed(() => props.meta.type.toUpperCase());
const componentName = computed(() => getMetaName(type.value));

const update = (key: string, value: any, handler: any) => {
  emit('update', key, value);
  return handler(value);
};
</script>

<style lang="scss" scoped>
:deep(.title) {
  color: #808080;
  font-size: 0.875rem !important;
  font-weight: normal;
}
</style>
