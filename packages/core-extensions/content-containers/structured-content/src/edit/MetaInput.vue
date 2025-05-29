<template>
  <component
    :is="componentName"
    :class="{ required: get(meta, 'validate.required') }"
    :error-messages="errorMessage"
    :dark="false"
    :meta="meta"
    :is-new="isNew"
    persistent-placeholder
    @update="updateMeta"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { get } from 'lodash-es';
import { getMetaName } from '@tailor-cms/utils';
import { useField } from 'vee-validate';

import type { Metadata } from '@tailor-cms/interfaces/schema';

interface Props {
  meta: Metadata;
  name?: string | null;
  isNew?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  name: null,
  isNew: false,
});

const emit = defineEmits(['update']);

const type = computed(() => props.meta.type.toUpperCase());
const componentName = computed(() => getMetaName(type.value));

const { errorMessage, handleChange, validate } = useField(
  () => props.meta.key,
  props.meta.validate,
  {
    label: props.meta.key,
    initialValue: props.meta.value,
  },
);

const updateMeta = async (key: string, value: any) => {
  handleChange(value, false);
  const { valid } = await validate();
  if (valid) emit('update', key, value);
};
</script>

<style lang="scss" scoped>
:deep(.title) {
  color: #808080;
  font-size: 0.875rem !important;
  font-weight: normal;
}
</style>
