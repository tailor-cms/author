<template>
  <VSelect
    :chips="meta.multiple"
    :items="meta.options"
    :label="meta.label"
    :multiple="meta.multiple"
    :name="meta.key"
    :placeholder="meta.placeholder"
    :small-chips="!hasImgProp"
    :value="meta.value"
    item-text="label"
    item-value="value"
    deletable-chips
    outlined
    @update:model-value="$emit('update', meta.key, input)"
  >
    <template v-if="hasImgProp" #item="{ item }">
      <img v-if="item.img" :alt="item.label" :src="item.img" class="img" />
      <span>{{ item.label }}</span>
    </template>
    <template v-if="hasImgProp" #selection="{ item }">
      <component :is="meta.multiple ? 'v-chip' : 'div'">
        <img v-if="item.img" :alt="item.label" :src="item.img" class="img" />
        <span>{{ item.label }}</span>
      </component>
    </template>
  </VSelect>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import type { Metadata } from '@tailor-cms/interfaces/schema';

interface Meta extends Metadata {
  value?: string;
}
const props = defineProps<{ meta: Meta; dark: boolean }>();
defineEmits(['update']);

const input = ref(props.meta.value);

const hasImgProp = computed(() => props.meta.options.some((it) => it.img));
</script>

<style lang="scss" scoped>
:deep(.v-list-item__content) {
  flex: initial;
}

:deep(.v-select__slot .v-select__selections) {
  min-height: 2.625rem !important;
}

.img {
  margin-right: 0.75rem;
  width: 2rem;
  height: 2rem;
}

.v-chip__content .img {
  width: 1.625rem;
  height: 1.625rem;
}
</style>
