<template>
  <div>
    <component
      :is="componentName"
      :class="{ required: get(meta, 'validate.required') }"
      :meta="meta"
      @update="(key: string, value: any) => $emit('update', key, value)"
    />
  </div>
</template>

<script lang="ts" setup>
import get from 'lodash/get';
import { getMetaName } from '@tailor-cms/utils';
import type { Meta } from '@tailor-cms/interfaces/common';

const props = defineProps<{ meta: Meta }>();
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
