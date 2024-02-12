<template>
  <div>
    <component
      :is="componentName"
      @update="(key: string, value: any) => $emit('update', key, value)"
      :meta="meta"
      :class="{ required: get(meta, 'validate.required') }"
    />
  </div>
</template>

<script lang="ts" setup>
import get from 'lodash/get';
import { getMetaName } from '@tailor-cms/utils';

const props = defineProps({
  meta: { type: Object, required: true },
});

const type = computed(() => props.meta.type.toUpperCase());
const componentName = computed(() => getMetaName(type.value));
</script>

<style lang="scss" scoped>
::v-deep .title {
  color: #808080;
  font-size: 0.875rem !important;
  font-weight: normal;
}
</style>
