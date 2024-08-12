<template>
  <component
    :is="componentName"
    :class="{ required: get(meta, 'validate.required') }"
    :dark="dark"
    :meta="meta"
    @update="(key: string, value: any) => $emit('update', key, value)"
  />
</template>

<script lang="ts" setup>
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

defineEmits(['update']);

const type = computed(() => props.meta.type.toUpperCase());
const componentName = computed(() => getMetaName(type.value));
</script>

<style lang="scss" scoped>
:deep(.title) {
  color: #808080;
  font-size: 0.875rem !important;
  font-weight: normal;
}
</style>
