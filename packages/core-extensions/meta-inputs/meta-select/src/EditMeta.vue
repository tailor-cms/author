<template>
  <VSelect
    v-model="input"
    :items="meta.options"
    :label="meta.label"
    :multiple="meta.multiple"
    :name="meta.key"
    :placeholder="meta.placeholder"
    :small-chips="!hasImgProp"
    item-title="label"
    variant="outlined"
    class="my-2"
    @update:model-value="$emit('update', meta.key, input)"
  >
    <template v-if="hasImgProp" #item="{ item, props: selectProps }">
      <VListItem v-bind="selectProps">
        <template #prepend="{ isSelected }">
          <VCheckboxBtn
            v-if="meta.multiple"
            :model-value="isSelected"
            class="mr-2"
            density="compact"
          />
          <VAvatar :image="item.raw.img" size="26" />
        </template>
      </VListItem>
    </template>
    <template v-if="meta.multiple" #chip="{ item, props: selectProps }">
      <VChip v-bind="selectProps" rounded="pill" closable pill>
        <VAvatar v-if="hasImgProp" :image="item.raw.img" start />
        {{ item.title }}
      </VChip>
    </template>
    <template v-if="hasImgProp" #selection="{ item }">
      <VAvatar :image="item.raw.img" class="mr-4" size="26" />
      {{ item.title }}
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
:deep(.v-select__selection .v-chip__content) {
  overflow: unset;
}
</style>
