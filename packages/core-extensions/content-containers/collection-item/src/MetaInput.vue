<template>
  <component
    :is="componentName"
    :class="{ required: get(meta, 'validate.required') }"
    :dark="false"
    :meta="meta"
    :readonly="isDisabled"
    persistent-placeholder
    @update="updateMeta"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { get } from 'lodash-es';
import { getMetaName } from '@tailor-cms/utils';

import type { Metadata } from '@tailor-cms/interfaces/schema';

interface Props {
  meta: Metadata;
  name?: string | null;
  isDisabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  name: null,
  isDisabled: false,
});

const emit = defineEmits(['update']);

const type = computed(() => props.meta.type.toUpperCase());
const componentName = computed(() => getMetaName(type.value));

const updateMeta = async (_key: string, value: any) => {
  emit('update', value);
};
</script>

<style lang="scss" scoped>
:deep(.title) {
  color: #808080;
  font-size: 0.875rem !important;
  font-weight: normal;
}
</style>
